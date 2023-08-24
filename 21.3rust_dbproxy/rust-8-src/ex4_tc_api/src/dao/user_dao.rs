use super::user::{UserRegister, UserLogin, UserPassword};
use sqlx::mysql::MySqlPool;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::mysql::MySqlRow;
use sqlx::Row;
use std::error::Error;
use std::sync::Arc;
use std::time::{Duration, Instant};

extern crate redis;
use crate::dao::user_dao::redis::Commands;   // 注意路径的引用
use crate::dao::user_dao::redis::ConnectionLike;
use redis::Connection;
use guid_create::GUID;

use std::cmp::Ordering;
use crate::dao::user_dao::redis::{RedisError, Value};

// 如果不想每次注册的时候都做数据库重连该怎么处理？
pub async fn user_register(user: &UserRegister) -> i32 {
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
pub async fn user_login(login: &UserLogin, token: & mut String) -> i32 {
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