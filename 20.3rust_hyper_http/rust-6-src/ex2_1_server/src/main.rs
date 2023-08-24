use std::{convert::Infallible, net::SocketAddr};
use hyper::{Body, Request, Response, Server};
use hyper::service::{make_service_fn, service_fn};

// 返回200
async fn handle(r: Request<Body>) -> Result<Response<Body>, Infallible> {
    println!("handle req:{:?}", r);
    Ok(Response::new("Hello, World!\n".into()))
}

#[tokio::main]
async fn main() {
    println!("1. SocketAddr::from");
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    // 从handle创建一个服务
    println!("2. make_service_fn");
    let make_svc = make_service_fn(|_conn| async {
        Ok::<_, Infallible>(service_fn(handle))
    });
    println!("3. Server::bind");
    let server = Server::bind(&addr).serve(make_svc);

    // 运行server
    println!("4. Server await");
    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}