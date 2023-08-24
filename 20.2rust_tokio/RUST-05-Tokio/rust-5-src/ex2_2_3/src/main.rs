use tokio::{self, runtime::Runtime, time};

fn main() {
    let rt = Runtime::new().unwrap();

    rt.block_on(async {
        let task = tokio::task::spawn(async {
            println!("tokio::task::spawn sleep 10s");
            time::sleep(time::Duration::from_secs(10)).await;
            println!("tokio::task::spawn sleep finish");  // 这里没有继续执行
        });

        // 让上面的异步任务跑起来
        time::sleep(time::Duration::from_millis(1)).await;
        task.abort();  // 取消任务
        // 取消任务之后，可以取得JoinError
        let abort_err = task.await.unwrap_err(); // let abort_err: JoinError = task.await.unwrap_err();
        println!("{}", abort_err.is_cancelled());
    })
}