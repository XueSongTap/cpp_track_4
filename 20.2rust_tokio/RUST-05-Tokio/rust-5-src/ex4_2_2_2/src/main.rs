use tokio::{ self, runtime::Runtime, sync };

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let (tx, mut rx) = sync::mpsc::channel::<i32>(10);

        for i in 1..=10 {
            let tx = tx.clone();
            tokio::spawn(async move {
                if tx.send(i).await.is_err() {
                    println!("receiver closed");
                }
            });
        }
        drop(tx);

        while let Some(i) = rx.recv().await {
            println!("received: {}", i);
        }
    });
}
