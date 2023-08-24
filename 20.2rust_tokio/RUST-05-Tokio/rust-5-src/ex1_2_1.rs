//ex1_2_1.rs
use std::thread::sleep;
use std:: time::Duration;
fn main() {
    println!("Before reading file 1");
    let file1_content = read_file1();
    println!("{:?}", file1_content);
    println!("After reading file 1");
    let file2_content = read_file2();
    println!("{:?}", file2_content);
    println!("After readinf file 2");
}
fn read_file1() -> String {
    sleep(Duration::new(4, 0));
    String::from("Hello from file 1")
}
fn read_file2() -> String {
    sleep(Duration::new(2, 0));
    String::from("Hello from file 2")
}
