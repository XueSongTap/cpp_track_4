
#![allow(unused)]
fn main() {
    struct Point {
         x: i32,
         y: i32,
     }

    let ((feet, inches), Point {x, y}) = ((3, 10), Point { x: 3, y: -10 });
    println!("feet:{}", feet);
    println!("inches:{}", inches);
}