use futures_util::TryStreamExt;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Method, Request, Response, Server, StatusCode};
use serde::{Deserialize, Serialize};
use sqlx::mysql::MySqlPool;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::mysql::MySqlRow;
use sqlx::FromRow;
use sqlx::Row;
use std::error::Error;
use std::sync::Arc;
use std::time::{Duration, Instant};

extern crate redis;
use crate::redis::Commands;
use crate::redis::ConnectionLike;
use redis::Connection;
use guid_create::GUID;

use std::cmp::Ordering;
use crate::redis::{RedisError, Value};

#[derive( Deserialize, Debug)]
struct UserRegister {
    #[serde(rename = "userName")]
    user_name: String,
    #[serde(rename = "firstPwd")]
    first_pwd: String,
    #[serde(rename = "nickName")]
    nick_name: String,
    phone: String,
    email: String,
}
#[derive(Serialize, Debug)]
struct UserRegisterResp {
    code: i32,
}

#[derive(Deserialize, Debug)]
struct UserLogin {
    user: String,  // 用户名
    pwd: String,    // 密码
}
#[derive(Serialize, Deserialize, Debug)]
struct UserLoginResp {
    code: i32,      // 返回状态
    token: String,  // 成功时的token
}

#[derive(sqlx::FromRow)]
# [derive (Debug)]
pub struct UserPassword {
    pub user_name: String,
    pub password: String,
}


// 如果不想每次注册的时候都做数据库重连该怎么处理？
async fn user_register(user: &UserRegister) -> i32 {
    // 连接数据库
    let db_url = "mysql://root:123456@127.0.0.1/actix_user_crud";
    let db_pool = MySqlPool::connect(db_url).await.unwrap();

    // 查询
    let tmp_user = sqlx::query(
        r#"
     SELECT `id`, `user_name`
     FROM `user_info`
     WHERE `user_name` = ?"#,
    )
    .bind(&user.user_name)
    .fetch_one(&db_pool)
    .await;
    match tmp_user {
        Ok(_) => {
            println!("user_exist true");
            return -1;
        },
        Err(e) => match e {
            sqlx::Error::RowNotFound => {
                println!("user no exist, we can register it");
            },
            _ => {
                println!("user_exist false: {}, ",e);       // 其他错误直接返回
                return -1;
            }
        }
        // Err(e) => {
        //     println!("user_exist false: {}, {}", e, e.kind());
        // }
    }
    // 插入用户
    // 增加
    let result = sqlx::query(
        r#"
        INSERT INTO user_info (`user_name`, `nick_name`, `password`, `phone`, `email`)
        VALUES(?, ?, ?, ?, ?)"#,
    )
    .bind(&user.user_name)
    .bind(&user.nick_name)
    .bind(&user.first_pwd)
    .bind(&user.phone)
    .bind(&user.email)
    .execute(&db_pool)
    .await;
    match result {
        Ok(_) => {
            println!("insert user ok");
            return 0;
        }
        Err(e) => {
            println!("insert user failed:{}", e); // nick_name也是唯一的,注册的时候要注意
            return -1;
        }
    }
}


// 现在先直接写死redis地址
async fn redis_set_token(user_name : &String, token : &String, ttl : usize) -> redis::RedisResult<()> {

    println!("set {} {} {}", user_name, token, ttl);
    let client = redis::Client::open("redis://127.0.0.1/")?;
    let mut con = client.get_connection()?;
     // 测试是否成功连接Reids
     let is_open = con.is_open();
     println!("is_open: {}", is_open);

    let _ : () = con.set_ex(user_name, token, ttl)?;
 
    Ok(())
}

// 现在先直接写死redis地址
// async fn redis_check_token(user_name : &String, token : &String, isok : &mut  bool ) -> redis::RedisResult<()> {

//     println!("get {}", user_name);
//     let client = redis::Client::open("redis://127.0.0.1/")?;
//     let mut con = client.get_connection()?;
//      // 测试是否成功连接Reids
//      let is_open = con.is_open();
//      println!("is_open: {}", is_open);
//     // 读取token
//     let temp_token: String = con.get(user_name)?;
     
//     if  temp_token.cmp(token) == Ordering::Equal {
//         println!("token校验成功 {:?}", temp_token);
//         isok = true;
//     }  
//     Ok(())
// }


// 如果不想每次注册的时候都做数据库重连该怎么处理？
async fn user_login(login: &UserLogin, token: & mut String) -> i32 {
    // 连接数据库
    let db_url = "mysql://root:123456@127.0.0.1/actix_user_crud";
    let db_pool = MySqlPool::connect(db_url).await.unwrap();

    // 查询
    let mut resutl = sqlx::query_as::<_, UserPassword>(
        r#"
        SELECT `user_name`, `password`
        FROM `user_info`
        WHERE `user_name` = ?"#,
    )
    .bind(&login.user)
    .fetch_one(&db_pool).await;

    match resutl {
        Ok(user_password) => {
            println!("user_exist true, {:?} ", user_password);
            // 处理业务
            // 判断 密码是否匹配
            if login.pwd == user_password.password {
                // 校验密码成功
                println!("密码校验成功");
                // 生成token
                let tmp_token = GUID::rand().to_string();  
                // 设置到redis 
                let ret = redis_set_token(&user_password.user_name, &tmp_token, 1000).await;
                if ret != Ok(()) {
                    println!("redis_set_token set failed");
                    return -1;
                }
                // let mut isok: bool = false;
                // let ret = redis_check_token(&user_password.user_name, &tmp_token, & mut isok).await;
                token.push_str(&tmp_token);
            } else {
                println!("密码校验失败");
                return -1;
            }
        },
        Err(e) => {
            println!("user_exist false: {}", e);
            return -1;
        }
    }

    return 0;
}

async fn tc_api_handle(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    let mut response = Response::new(Body::empty());
    // 通过req.method()和req.uri().path()来识别方法和请求路径
    match (req.method(), req.uri().path()) {
        (&Method::POST, "/api/reg") => { // 处理注册请求
            let mut user_resp = UserRegisterResp { code: 0 };
            // 读取json数据做解析
            let full_body = hyper::body::to_bytes(req.into_body()).await?; // 读取数据
            // let user: UserRegister = serde_json::from_slice(&full_body).unwrap(); // 反序列化
            let result = serde_json::from_slice(&full_body); // 反序列化
            match result {
                Ok(user) => {
                    println!("parse user json ok");
                    println!("user reg:{:?}", user);
                    // 注册用户，注册成功返回0，注册失败返回其他值
                    let result = user_register(&user).await;
                    if result != 0 {
                        user_resp.code = 1; // 注册失败
                    } 
                },
                Err(e) => {
                    user_resp.code = 1; // 注册失败
                    println!("parse user json failed:{}", e); // nick_name也是唯一的,注册的时候要注意
                },
            }
            *response.body_mut() = Body::from(serde_json::to_string(&user_resp).unwrap());
        }
        (&Method::POST, "/api/login") => {
            println!("/api/login");
            // 查询数据库
            // 生成token设置到redis
            // 返回正常结果
            let mut login_resp = UserLoginResp { code: 0, token: String::from("")};
            // 1 读取json数据做解析
            let full_body = hyper::body::to_bytes(req.into_body()).await?; // 读取数据
            let result = serde_json::from_slice(&full_body); // 反序列化
            match result {
                Ok(login) => {
                    println!("parse login json ok");
                    println!("user login:{:?}", login);
                    let mut token :String = String::from("");
                    // 注册用户，注册成功返回0，注册失败返回其他值
                    let result = user_login(&login, &mut token).await;
                    if result != 0 {
                        login_resp.code = 1; // 注册失败
                    } else {
                        login_resp.token = token.clone();
                    } 
                },
                Err(e) => {
                    login_resp.code = 1; // 注册失败
                    println!("parse user json failed:{}", e); // nick_name也是唯一的,注册的时候要注意
                },
            }
            *response.body_mut() = Body::from(serde_json::to_string(&login_resp).unwrap());
        }
        _ => {
            *response.status_mut() = StatusCode::NOT_FOUND;
        }
    };

    Ok(response)
}

#[tokio::main]
async fn main() {
    let addr = ([0, 0, 0, 0], 3000).into();

    let make_svc =
        make_service_fn(|_conn| async { Ok::<_, hyper::Error>(service_fn(tc_api_handle)) });

    let server = Server::bind(&addr).serve(make_svc);

    println!("listen: {}", addr);
    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}
