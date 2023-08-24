use hyper::Client;
use hyper::body::HttpBody;
use tokio::io::{stdout, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

    // 构建一个client，调用GET
    let client = Client::new();
    let uri = "http://127.0.0.1:3000".parse()?;
    let mut resp = client.get(uri).await?;
    println!("Response: {}", resp.status());
    
    // 将response（是个stream）输出到stdout
    while let Some(chunk) = resp.body_mut().data().await {
        stdout().write_all(&chunk?).await?;
    }

    Ok(())
}