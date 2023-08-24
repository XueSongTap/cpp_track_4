// 2.4 变量覆盖

fn match_test() {
    println!("match_test");
    let age = Some(30);
   println!("在匹配前，age是{:?}",age);
   match age {
       Some(age) =>  println!("匹配出来的age是{}",age),
       _ => ()
   }
   println!("在匹配后，age是{:?}",age);
}


fn if_let_test() {
    println!("\nif_let_test");
    let age = Some(30);
    println!("在匹配前，age是{:?}",age);
    if let Some(age) = age {
        println!("匹配出来的age是{}",age);
    }
 
    println!("在匹配后，age是{:?}",age);
}
fn main() {
    match_test();
    if_let_test();
 }