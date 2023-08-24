use tokio::{self, runtime::Runtime, sync};

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let (tx, rx) = sync::oneshot::channel();

        tokio::spawn(async move {
            if tx.send(33).is_err() {
                println!("receiver dropped");
            }
        });

        match rx.await {
            Ok(value) => println!("received: {:?}", value),
            Err(_) => println!("sender dropped"),
        };
    });
}
