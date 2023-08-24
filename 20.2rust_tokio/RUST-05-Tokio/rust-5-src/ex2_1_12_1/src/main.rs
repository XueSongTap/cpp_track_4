use std::thread;
use tokio;
async fn hello_world(hi:&str) {
    println!("hello {}", hi);
}
fn main() {
    let t1 = thread::spawn(|| {
        let rt = tokio::runtime::Builder::new_current_thread().build().unwrap();
        let future = hello_world("t1");
        rt.block_on(future);
    });

    let t2 = thread::spawn(|| {
        let rt = tokio::runtime::Builder::new_current_thread().build().unwrap();
        let future = hello_world("t2");
        rt.block_on(future);
    });

    t1.join().unwrap();
    t2.join().unwrap();
}
