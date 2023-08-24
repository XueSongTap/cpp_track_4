use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Method, Request, Response, Server, StatusCode};
use ex4_tc_api::model::user::{UserLoginResp, UserRegisterResp};
use ex4_tc_api::dao::user_dao::{user_login, user_register};



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
