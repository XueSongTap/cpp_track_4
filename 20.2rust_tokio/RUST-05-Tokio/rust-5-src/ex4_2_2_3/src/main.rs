use chrono::Local;
use tokio::{self, sync, runtime::Runtime, time::{self, Duration}};

fn now() -> String {
    Local::now().format("%F %T").to_string()
}

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let (tx, mut rx) = sync::mpsc::channel::<i32>(5);

        tokio::spawn(async move {
            for i in 1..=7 {
              if tx.send(i).await.is_err() {
                println!("receiver closed");
                return;
              }
              println!("sended: {}, {}", i, now());
            }
        });

        time::sleep(Duration::from_secs(1)).await;
        while let Some(i) = rx.recv().await {
            println!("received: {}", i);
        }
    });
}
