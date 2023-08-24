//ex1_2_2.rs
use std::thread::sleep;
use std::time::Duration;
use std::thread;
fn main() {
    let handle1 = std::thread::spawn(move || {
        let file1_content = read_file1();
        println!("{:?}", file1_content);
    });

    let handle2 = std::thread::spawn(move || {
        let file2_content = read_file2();
        println!("{:?}", file2_content);
    });

    handle1.join().unwrap();
    handle2.join().unwrap();  
}
fn read_file1() -> String {
    sleep(Duration::new(4, 0));
    String::from("Hello from file 1.")
}
fn read_file2() -> String {
    sleep(Duration::new(2, 0));
    String::from("Hello from file 2.")
}
