use tokio;
use tokio::time::Instant;
use tokio::time::Duration;

#[tokio::main]
async fn main() {
    // 创建代表此时此刻的时间点
    let now = Instant::now();
    
    // Instant 加一个Duration，得到另一个Instant
    let next_3_sec = now + Duration::from_secs(3);
    // Instant之间的大小比较
    println!("{}", now < next_3_sec);  // true
    
    // Instant减Duration，得到另一个Instant
    let new_instant = next_3_sec - Duration::from_secs(2);
    
    // Instant减另一个Instant，得到Duration
    // 注意，Duration有它的有效范围，因此必须是大的Instant减小的Instant，反之将panic
    let duration = next_3_sec - new_instant;
}