
#![allow(unused)]
fn main() {
    let s = Some(String::from("Hello!"));

    if let Some(_s) = s {
        println!("found a string");
    }
    // if let Some(_) = s { // 只使用下划线本身，则并不会绑定值，因为 `s` 没有被移动进 `_`
    //     println!("found a string");
    // }
    println!("{:?}", s);
}
