use std::thread;

use chrono::Local;
use tokio::{self, runtime::Runtime, time};

fn now() -> String {
    Local::now().format("%F %T").to_string()
}

// 在runtime外部定义一个异步任务，且该函数返回值不是Future类型
fn async_task() {
  println!("create an async task: {}", now());
  tokio::spawn(async {
    time::sleep(time::Duration::from_secs(10)).await;
    println!("async task over: {}", now());
  });
}

fn main() {
    let rt1 = Runtime::new().unwrap();
    rt1.block_on(async {
      // 调用函数，该函数内创建了一个异步任务，将在当前runtime内执行
      async_task();
    });
}

// use tokio::{Runtime, time}
// fn async_task(rt: &Runtime) {
//   rt.spawn(async {
//     time::sleep(time::Duration::from_secs(10)).await;
//   });
// }

// fn main(){
//   let rt = Runtime::new().unwrap();
//   rt.block_on(async {
//     async_task(&rt);
//   });
// }