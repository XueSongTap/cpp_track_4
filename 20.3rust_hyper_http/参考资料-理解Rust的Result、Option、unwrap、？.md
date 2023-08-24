# 理解Rust的Result/Option/unwrap/?

**简介：** 我在学习Rust时，注意到有4个概念经常放到一起讨论：Result、Option、unwapr和?操作符。本文记录了我对这4个Rust概念的思考，这个思考过程帮助我理解并学会了如何写出更地道的Rust代码。

我在学习Rust时，注意到有4个概念经常放到一起讨论：Result、Option、unwapr和?操作符。本文记录了我对这4个Rust概念的思考，这个思考过程帮助我理解并学会了如何写出更地道的Rust代码。

## 1、Option - 可空变量

虽然Rust中有null的概念，但是使用null并不是Rust中常见的模式。假设我们要写一个函数，输入一种手机操作系统的名称，这个函数就会返回其应用商店的名称。如果传入字符串`iOS`，该函数将返回`App Store`；如果传入字符串`android`，那么该函数将返回Play Store。任何其他的输入都被视为无效。

在大多数开发语言中，我们可以选择返回null或字符串`invalid`来表示无效的结果，不过这不是Rust的用法。

地道的Rust代码应该让该函数返回一个`Option`。Option或更确切的说`Option<T>`是一个泛型，可以是`Some<T>`或`None`（为了便于阅读，后续文章中将省略类型参数T）。Rust将`Some`和`None`称为变体（Variant） —— 这一概念在其他语言中并不存在，因此我也不
去定义到底什么是变体了。

在我们的示例中，正常情况下函数将返回包裹在Some变体中的字符串常量App Store或Play Store。而在非正常情况下，函数将返回None。

```
fn find_store(mobile_os: &str) -> Option<&str> {
    match mobile_os {
        "iOS" => Some("App Store"),
        "android" => Some("Play Store"),
        _ => None
    }
}
```

要使用find_store()，我们可以用如下方式调用：

```
fn main() {
    println!("{}", match find_store("windows") {
        Some(s) => s,
        None => "Not a valid mobile OS"
    });
}
```

完整的代码如下：

```
fn find_store(mobile_os: &str) -> Option<&str> {
    match mobile_os {
        "iOS" => Some("App Store"),
        "android" => Some("Play Store"),
        _ => None
    }
}

fn main() {
    println!("{}", match find_store("windows") {
        Some(s) => s,
        None => "Not a valid mobile OS"
    });
}
```

## 2、Result - 包含错误信息的结果

`Result`，或者更确切地说`Result<T,E>`，是和Rust中的Option相关的概念，它是一个加强版本的Option。

Result可能有以下结果之一：

- Ok(T)：结果为成员T
- Err(E)：结果为故障成员E

与之前我们看到Option可以包含Some或None不同，Result中包含了错误相关信息，这是Option中所没有的。

让我们看一个函数实例，它返回一个Result。该函数摘自用于解析JSON字符串的serde_json库，其签名为：

```
pub fn from_str<'a, T>(s: &'a str) -> Result<T, Error> 
where
    T: Deserialize<'a>, 
```

假设我们要解析如下的字符串：

```
let json_string = r#"
    {
        "name": "John Doe",
        "age": 43,
        "phones": [
            "+44 1234567",
            "+44 2345678"
        ]
    }"#;
```

目标是解析为Rust的一个person结构对象：

```
#[derive(Serialize, Deserialize)]
struct Person {
    name: String,
    age: u8,
    phones: Vec<String>,
}
```

解析过程的Rust代码如下：

```
let p:Person = match serde_json::from_str(json_string) {
    Ok(p) => p,
    Err(e) => ... //we will discuss what goes here next 
};
```

正常情况下可以得到期望的结果。不过假设在输入的json_string中有一个笔误，这导致程序运行时将执行Err分支。

当碰到Err时，我们可以采取两个动作：

- panic!
- 返回Err

## 3、unwrap - 故障时执行panic！

在上面的示例中，假设我们期望panic!：

```
let p: Person = match serde_json::from_str(data) {
        Ok(p) => p,
        Err(e) => panic!("cannot parse JSON {:?}, e"), //panic
    }
```

当碰到Err时，上面的代码panic!就会崩掉整个程序，也许这不是你期望的。我们可以修改为：

```
let p:Person = serde_json::from_str(data).unwrap();
```

如果我们可以确定输入的json_string始终会是可解析的，那么使用unwrap没有问题。但是如果会出现Err，那么程序就会崩溃，无法从故障中恢复。在开发过程中，当我们更关心程序的主流程时，unwrap也可以作为快速
原型使用。

因此unwrap隐含了panic!。虽然与更显式的版本没有差异，但是危险在于其隐含特性，因为有时这并不是你真正期望的行为。

无论如何，如果我们需要调用panic!，代码如下：

```
use serde::{Deserialize, Serialize};
use serde_json::Result;

#[derive(Serialize, Deserialize)]
struct Person {
    name: String,
    age: u8,
    phones: Vec<String>,
}

fn typed_example() -> Result<()> {
    //age2 is error on purpose
    let data = r#"
        {
            "name": "John Doe",
            "age2": 43,
            "phones": [
                "+44 1234567",
                "+44 2345678"
            ]
        }"#;

    let p:Person = serde_json::from_str(data).unwrap();

    println!("Please call {} at the number {}", p.name, p.phones[0]);

    Ok(())
}

fn main() {
    match typed_example() {
        Ok(_) => println!("program ran ok"),
        Err(_) => println!("program ran with error"),
    }
}
```

## 4、? - 故障时返回Err对象

当碰到Err时，我们不一定要panic!，也可以返回Err。不是每个Err都是不可恢复的，因此有时并不需要panic!。下面的代码返回Err：

```
let p: Person = match serde_json::from_str(data) {
        Ok(p) => p,
        Err(e) => return Err(e.into()),
};
```

`?`操作符提供了一个更简洁的方法来替换上面的代码：

```
let p:Person = serde_json::from_str(data)?;
```

这时完整的Rust程序代码如下：

```
use serde::{Deserialize, Serialize};
use serde_json::Result;

#[derive(Serialize, Deserialize)]
struct Person {
    name: String,
    age: u8,
    phones: Vec<String>,
}

fn typed_example() -> Result<()> {
    //age2 is error on purpose
    let data = r#"
        {
            "name": "John Doe",
            "age2": 43,
            "phones": [
                "+44 1234567",
                "+44 2345678"
            ]
        }"#;

    let p: Person = serde_json::from_str(data)?;

    println!("Please call {} at the number {}", p.name, p.phones[0]);

    Ok(())
}

fn main() {
    match typed_example() {
        Ok(_) => println!("program ran ok"),
        Err(e) => println!("program ran with error {:?}", e),
    }
}
```

## 5、使用unwrap和?解包Option

就像我们可以使用unwarp和?来处理Result，我们也可以使用unwrap和?来处理Option。

如果我们unwrap的Option的值是None，那么程序就会panic!。示例如下：

```
fn next_birthday(current_age: Option<u8>) -> Option<String> {
    // If `current_age` is `None`, this returns `None`.
    // If `current_age` is `Some`, the inner `u8` gets assigned to `next_age` after 1 is added to it
    let next_age: u8 = current_age?;
    Some(format!("Next year I will be {}", next_age + 1))
}

fn main() {
  let s = next_birthday(None);
  match s {
      Some(a) => println!("{:#?}", a),
      None => println!("No next birthday")
  }
}
```