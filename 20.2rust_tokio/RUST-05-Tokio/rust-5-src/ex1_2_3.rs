//ex1_2_2.rs
use std::thread::sleep;
use std::time::Duration;
use std::thread;

#[tokio::main]
fn main() {
    println!("Before reading file 1");
    let h1 = tokio::spawn(async {
        
    });
}
fn read_file1() -> String {
    sleep(Duration::new(4, 0));
    String::from("Hello from file 1.")
}
fn read_file2() -> String {
    sleep(Duration::new(2, 0));
    String::from("Hello from file 2.")
}
