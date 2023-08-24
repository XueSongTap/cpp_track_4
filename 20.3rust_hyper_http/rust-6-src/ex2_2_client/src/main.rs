use hyper::Client;
use hyper::{Body, Method, Request};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct UserRegister<'a> {
    user: &'a str,
    pwd: &'a str,
}
#[derive(Serialize, Deserialize, Debug)]
struct UserRegisterResp<'a> {
    user: &'a str,
    status: &'a str,
}
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // let req = Request::builder()
    //     .method(Method::POST)
    //     .uri("http://127.0.0.1:3000/echo/reverse")
    //     .body(Body::from("echo"))?;

    // let client = Client::new();
    // let resp = client.request(req).await?;
    // println!("Response: {}", resp.status());
    // println!("{:?}", hyper::body::to_bytes(resp.into_body()).await.unwrap());

    let user = UserRegister { user: "darren", pwd: "123456"};
    let req = Request::builder()
        .method(Method::POST)
        .uri("http://127.0.0.1:3000/json")
        .body(Body::from(serde_json::to_string(&user).unwrap()))?; // 注意?的意义，正常时返回对应的value

    let client = Client::new();
    let resp = client.request(req).await?;
    println!("Response: {}", resp.status());

    let full_body = hyper::body::to_bytes(resp.into_body()).await?; // 读取返回的数据
    // 反序列化
    let userResp: UserRegisterResp = serde_json::from_slice(&full_body).unwrap();

    println!("body:{:?}", full_body);  // 字节
    println!("body:{:?}", String::from_utf8_lossy(&full_body)); // 字符串
    println!("{:?}", userResp); // 结构体

    Ok(())
}