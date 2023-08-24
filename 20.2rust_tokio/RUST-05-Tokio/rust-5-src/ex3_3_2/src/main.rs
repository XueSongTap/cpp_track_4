use tokio::{self, runtime::Runtime, time};

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let start = time::Instant::now();
        // time::sleep(time::Duration::from_nanos(100)).await;
        // time::sleep(time::Duration::from_micros(100)).await;
        time::sleep(time::Duration::from_micros(10)).await;
        println!("sleep {}", time::Instant::now().duration_since(start).as_nanos());
    });
}