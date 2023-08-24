use std::env;       // 解析命令行
use hyper::{body::HttpBody as _, Client};
use tokio::io::{self, AsyncWriteExt as _};

type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

#[tokio::main]
async fn main() -> Result<()> {
    // 日志初始化
    pretty_env_logger::init();

    // 从命令行参数解析url
    let url = match env::args().nth(1) {
        Some(url) => url,
        None => {
            println!("Usage: client <url>"); // 比如./target/debug/ex4_1_client http://www.baidu.com
            return Ok(());
        }
    };
    //封装http url
    let url = url.parse::<hyper::Uri>().unwrap();  // 传入模板hyper::Uri
    if url.scheme_str() != Some("http") {
        println!("This example only works with 'http' URLs.");
        return Ok(());
    }
    fetch_url(url).await
}

async fn fetch_url(url : hyper::Uri) -> Result<()> {
    // 创建一个客户端
    let client = Client::new();
    // get请求并返回结果
    let mut res = client.get(url).await?;
    println!("Response: {}", res.status());
    println!("Headers: {:#?}\n", res.headers());

    // 读取返回结果，读取完毕再退出
    while let Some(next) = res.data().await {
         let chunk = next?;
         io::stdout().write_all(&chunk).await?;
    }
    println!("\n\nDone!");

    Ok(())
}