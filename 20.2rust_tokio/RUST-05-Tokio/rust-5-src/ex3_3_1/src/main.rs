use tokio::{self, runtime::Runtime, time};

fn main(){
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        // 睡眠2秒
        time::sleep(time::Duration::from_secs(2)).await;

        // 一直睡眠，睡到2秒后醒来
        time::sleep_until(time::Instant::now() + time::Duration::from_secs(2)).await;
    });
}