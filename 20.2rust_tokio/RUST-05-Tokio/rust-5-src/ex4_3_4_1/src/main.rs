
#![allow(unused)]
fn main() {
use tokio::sync::Barrier;
use std::sync::Arc;

let mut handles = Vec::with_capacity(10);

// 参数10表示屏障宽度为10，只等待10个任务达到屏障点就放行这一批任务
// 也就是说，某时刻已经有9个任务在等待，当第10个任务调用wait的时候，屏障将放行这一批
let barrier = Arc::new(Barrier::new(10));

for _ in 0..10 {
    let c = barrier.clone();
    handles.push(tokio::spawn(async move {
        println!("before wait");

        // 在此设置屏障，保证10个任务都已输出before wait才继续向下执行
        let wait_result = c.wait().await;
        println!("after wait");
        wait_result
    }));
}

let mut num_leaders = 0;
for handle in handles {
    let wait_result = handle.await.unwrap();
    if wait_result.is_leader() {
        num_leaders += 1;
    }
}

assert_eq!(num_leaders, 1);
}
