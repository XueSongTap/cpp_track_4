use tokio::{ self, runtime::Runtime, sync };

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let (tx, mut rx) = sync::mpsc::channel::<i32>(10);

        tokio::spawn(async move {
            for i in 1..=10 {
                // if let Err(_) = tx.send(i).await {}
                if tx.send(i).await.is_err() {
                    println!("receiver closed");
                    return;
                }
            }
        });

        while let Some(i) = rx.recv().await {
            println!("received: {}", i);
        }
    });
}
