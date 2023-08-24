#[tokio::main]
async fn main() {
    let mut count = 0u8;
    loop {
        tokio::select! {
            // 如果取消biased，挑选的任务顺序将随机，可能会导致分支中的断言失败
            biased;
            _ = async {}, if count < 1 => { count += 1; println!("< 1"); assert_eq!(count, 1); }
            _ = async {}, if count < 2 => { count += 1; println!("< 2");assert_eq!(count, 2); }
            _ = async {}, if count < 3 => { count += 1; println!("< 3");assert_eq!(count, 3); }
            _ = async {}, if count < 4 => { count += 1; println!("< 4");assert_eq!(count, 4); }
            else => { break; }
        };
    }
}