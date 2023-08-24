

版权归rust语言圣经原作者所有，如有侵权请联系删除。



# 1 枚举

枚举(enum 或 enumeration)允许你通过列举可能的成员来定义一个**枚举类型**，例如扑克牌花色：

```rust
enum PokerSuit {
  Clubs,
  Spades,
  Diamonds,
  Hearts,
}
```

如果在此之前你没有在其它语言中使用过枚举，那么可能需要花费一些时间来理解这些概念，一旦上手，就会发现枚举的强大，甚至对它爱不释手，枚举虽好，可不要滥用哦。

再回到之前创建的 `PokerSuit`，扑克总共有四种花色，而这里我们枚举出所有的可能值，这也正是 `枚举` 名称的由来。

任何一张扑克，它的花色肯定会落在四种花色中，而且也只会落在其中一个花色上，这种特性非常适合枚举的使用，因为**枚举值**只可能是其中某一个成员。抽象来看，四种花色尽管是不同的花色，但是它们都是扑克花色这个概念，因此当某个函数处理扑克花色时，可以把它们当作相同的类型进行传参。

细心的读者应该注意到，我们对之前的 `枚举类型` 和 `枚举值` 进行了重点标注，这是因为对于新人来说容易混淆相应的概念，总而言之：
**枚举类型是一个类型，它会包含所有可能的枚举成员, 而枚举值是该类型中的具体某个成员的实例。**

## 1.1 枚举值

现在来创建 `PokerSuit` 枚举类型的两个成员实例：

```rust
let heart = PokerSuit::Hearts;
let diamond = PokerSuit::Diamonds;
```

我们通过 `::` 操作符来访问 `PokerSuit` 下的具体成员，从代码可以清晰看出，`heart` 和 `diamond` 都是 `PokerSuit` 枚举类型的，接着可以定义一个函数来使用它们：

```rust
fn main() {
    let heart = PokerSuit::Hearts;
    let diamond = PokerSuit::Diamonds;

    print_suit(heart);
    print_suit(diamond);
}

fn print_suit(card: PokerSuit) {
    println!("{:?}",card);
}
```

`print_suit` 函数的参数类型是 `PokerSuit`，因此我们可以把 `heart` 和 `diamond` 传给它，虽然 `heart` 是基于 `PokerSuit` 下的 `Hearts` 成员实例化的，但是它是货真价实的 `PokerSuit` 枚举类型。

接下来，我们想让扑克牌变得更加实用，那么需要给每张牌赋予一个值：`A`(1)-`K`(13)，这样再加上花色，就是一张真实的扑克牌了，例如红心 A。

目前来说，枚举值还不能带有值，因此先用结构体来实现：

```rust
enum PokerSuit {
    Clubs,
    Spades,
    Diamonds,
    Hearts,
}

struct PokerCard {
    suit: PokerSuit,
    value: u8
}

fn main() {
   let c1 = PokerCard {
       suit: PokerSuit::Clubs,
       value: 1,
   };
   let c2 = PokerCard {
       suit: PokerSuit::Diamonds,
       value: 12,
   };
}
```

这段代码很好的完成了它的使命，通过结构体 `PokerCard` 来代表一张牌，结构体的 `suit` 字段表示牌的花色，类型是 `PokerSuit` 枚举类型，`value` 字段代表扑克牌的数值。

可以吗？可以！好吗？说实话，不咋地，因为还有简洁得多的方式来实现：

```rust
enum PokerCard {
    Clubs(u8),
    Spades(u8),
    Diamonds(u8),
    Hearts(u8),
}

fn main() {
   let c1 = PokerCard::Spades(5);
   let c2 = PokerCard::Diamonds(13);
}
```

直接将数据信息关联到枚举成员上，省去近一半的代码，这种实现是不是更优雅？

不仅如此，同一个枚举类型下的不同成员还能持有不同的数据类型，例如让某些花色打印 `1-13` 的字样，另外的花色打印上 `A-K` 的字样：

```rust
enum PokerCard {
    Clubs(u8),
    Spades(u8),
    Diamonds(char),
    Hearts(char),
}

fn main() {
   let c1 = PokerCard::Spades(5);
   let c2 = PokerCard::Diamonds('A');
}
```

回想一下，遇到这种不同类型的情况，再用我们之前的结构体实现方式，可行吗？也许可行，但是会复杂很多。

再来看一个来自标准库中的例子：

```rust
struct Ipv4Addr {
    // --snip--
}

struct Ipv6Addr {
    // --snip--
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

这个例子跟我们之前的扑克牌很像，只不过枚举成员包含的类型更复杂了，变成了结构体：分别通过 `Ipv4Addr` 和 `Ipv6Addr` 来定义两种不同的 IP 数据。

从这些例子可以看出，**任何类型的数据都可以放入枚举成员中**: 例如字符串、数值、结构体甚至另一个枚举。

增加一些挑战？先看以下代码：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let m1 = Message::Quit;
    let m2 = Message::Move{x:1,y:1};
    let m3 = Message::ChangeColor(255,255,0);
}
```

该枚举类型代表一条消息，它包含四个不同的成员：

- `Quit` 没有任何关联数据
- `Move` 包含一个匿名结构体
- `Write` 包含一个 `String` 字符串
- `ChangeColor` 包含三个 `i32`

当然，我们也可以用结构体的方式来定义这些消息：

```rust
struct QuitMessage; // 单元结构体
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String); // 元组结构体
struct ChangeColorMessage(i32, i32, i32); // 元组结构体
```

由于每个结构体都有自己的类型，因此我们无法在需要同一类型的地方进行使用，例如某个函数它的功能是接受消息并进行发送，那么用枚举的方式，就可以接收不同的消息，但是用结构体，该函数无法接受 4 个不同的结构体作为参数。

而且从代码规范角度来看，枚举的实现更简洁，代码内聚性更强，不像结构体的实现，分散在各个地方。

## 1.2 同一化类型

最后，再用一个实际项目中的简化片段，来结束枚举类型的语法学习。

例如我们有一个 WEB 服务，需要接受用户的长连接，假设连接有两种：`TcpStream` 和 `TlsStream`，但是我们希望对这两个连接的处理流程相同，也就是用同一个函数来处理这两个连接，代码如下：

```rust
fn new (stream: TcpStream) {
  let mut s = stream;
  if tls {
    s = negotiate_tls(stream)
  }

  // websocket是一个WebSocket<TcpStream>或者
  //   WebSocket<native_tls::TlsStream<TcpStream>>类型
  websocket = WebSocket::from_raw_socket(
    stream, ......)
}
```

此时，枚举类型就能帮上大忙：

```rust
enum Websocket {
  Tcp(Websocket<TcpStream>),
  Tls(Websocket<native_tls::TlsStream<TcpStream>>),
}
```

## 1.3 Option 枚举用于处理空值

在其它编程语言中，往往都有一个 `null` 关键字，该关键字用于表明一个变量当前的值为空（不是零值，例如整形的零值是 0），也就是不存在值。当你对这些 `null` 进行操作时，例如调用一个方法，就会直接抛出**null 异常**，导致程序的崩溃，因此我们在编程时需要格外的小心去处理这些 `null` 空值。

> Tony Hoare， `null` 的发明者，曾经说过一段非常有名的话
>
> 我称之为我十亿美元的错误。当时，我在使用一个面向对象语言设计第一个综合性的面向引用的类型系统。我的目标是通过编译器的自动检查来保证所有引用的使用都应该是绝对安全的。不过在设计过程中，我未能抵抗住诱惑，引入了空引用的概念，因为它非常容易实现。就是因为这个决策，引发了无数错误、漏洞和系统崩溃，在之后的四十多年中造成了数十亿美元的苦痛和伤害。

尽管如此，空值的表达依然非常有意义，因为空值表示当前时刻变量的值是缺失的。有鉴于此，Rust 吸取了众多教训，决定抛弃 `null`，而改为使用 `Option` 枚举变量来表述这种结果。

`Option` 枚举包含两个成员，一个成员表示含有值：`Some(T)`, 另一个表示没有值：`None`，定义如下：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

其中 `T` 是泛型参数，`Some(T)`表示该枚举成员的数据类型是 `T`，换句话说，`Some` 可以包含任何类型的数据。

`Option<T>` 枚举是如此有用以至于它被包含在了 [`prelude`](https://course.rs/appendix/prelude.html)（prelude 属于 Rust 标准库，Rust 会将最常用的类型、函数等提前引入其中，省得我们再手动引入）之中，你不需要将其显式引入作用域。另外，它的成员 `Some` 和 `None` 也是如此，无需使用 `Option::` 前缀就可直接使用 `Some` 和 `None`。总之，不能因为 `Some(T)` 和 `None` 中没有 `Option::` 的身影，就否认它们是 `Option` 下的卧龙凤雏。

再来看以下代码：

```rust
let some_number = Some(5);
let some_string = Some("a string");

let absent_number: Option<i32> = None;
```

如果使用 `None` 而不是 `Some`，需要告诉 Rust `Option<T>` 是什么类型的，因为编译器只通过 `None` 值无法推断出 `Some` 成员保存的值的类型。

当有一个 `Some` 值时，我们就知道存在一个值，而这个值保存在 `Some` 中。当有个 `None` 值时，在某种意义上，它跟空值具有相同的意义：并没有一个有效的值。那么，`Option<T>` 为什么就比空值要好呢？

简而言之，因为 `Option<T>` 和 `T`（这里 `T` 可以是任何类型）是不同的类型，例如，这段代码不能编译，因为它尝试将 `Option<i8>`(`Option<T>`) 与 `i8`(`T`) 相加：

```rust
let x: i8 = 5;
let y: Option<i8> = Some(5);

let sum = x + y;
```

如果运行这些代码，将得到类似这样的错误信息：

```text
error[E0277]: the trait bound `i8: std::ops::Add<std::option::Option<i8>>` is
not satisfied
 -->
  |
5 |     let sum = x + y;
  |                 ^ no implementation for `i8 + std::option::Option<i8>`
  |
```

很好！事实上，错误信息意味着 Rust 不知道该如何将 `Option<i8>` 与 `i8` 相加，因为它们的类型不同。当在 Rust 中拥有一个像 `i8` 这样类型的值时，编译器确保它总是有一个有效的值，我们可以放心使用而无需做空值检查。只有当使用 `Option<i8>`（或者任何用到的类型）的时候才需要担心可能没有值，而编译器会确保我们在使用值之前处理了为空的情况。

换句话说，在对 `Option<T>` 进行 `T` 的运算之前必须将其转换为 `T`。通常这能帮助我们捕获到空值最常见的问题之一：期望某值不为空但实际上为空的情况。

不再担心会错误的使用一个空值，会让你对代码更加有信心。为了拥有一个可能为空的值，你必须要显式的将其放入对应类型的 `Option<T>` 中。接着，当使用这个值时，必须明确的处理值为空的情况。只要一个值不是 `Option<T>` 类型，你就 **可以** 安全的认定它的值不为空。这是 Rust 的一个经过深思熟虑的设计决策，来限制空值的泛滥以增加 Rust 代码的安全性。

那么当有一个 `Option<T>` 的值时，如何从 `Some` 成员中取出 `T` 的值来使用它呢？`Option<T>` 枚举拥有大量用于各种情况的方法：你可以查看[它的文档](https://doc.rust-lang.org/std/option/enum.Option.html)。熟悉 `Option<T>` 的方法将对你的 Rust 之旅非常有用。

总的来说，为了使用 `Option<T>` 值，需要编写处理每个成员的代码。你想要一些代码只当拥有 `Some(T)` 值时运行，允许这些代码使用其中的 `T`。也希望一些代码在值为 `None` 时运行，这些代码并没有一个可用的 `T` 值。`match` 表达式就是这么一个处理枚举的控制流结构：它会根据枚举的成员运行不同的代码，这些代码可以使用匹配到的值中的数据。

这里先简单看一下 `match` 的大致模样，在[模式匹配](https://course.rs/basic/match-pattern/intro.html)中，我们会详细讲解：

```rust

#![allow(unused)]
fn main() {
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            None => None,
            Some(i) => Some(i + 1),
        }
    }

    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
}
```

`plus_one` 通过 `match` 来处理不同 `Option` 的情况。






## 1.4 课后练习

> [Rust By Practice](https://zh.practice.rs/compound-types/enum.html)，支持代码在线编辑和运行，并提供详细的[习题解答](https://github.com/sunface/rust-by-practice)。

# **2 模式匹配**



模式匹配，这个词，对于非函数语言编程来说，真的还蛮少听到，因为它经常出现在函数式编程里，用于为复杂的类型系统提供一个轻松的解构能力。



曾记否？在枚举和流程控制那章，我们遗留了两个问题，都是关于 `match` 的，第一个是如何对 `Option` 枚举进行进一步处理，另外一个就是如何用 `match` 来替代 `else if` 这种丑陋的多重分支使用方式，那么让我们先一起来揭开 `match` 的神秘面纱。



# 2 match 和 if let

在 Rust 中，模式匹配最常用的就是 `match` 和 `if let`，本章节将对两者及相关的概念进行详尽介绍。

先来看一个关于 `match` 的简单例子：

```rust
enum Direction {
    East,
    West,
    North,
    South,
}

fn main() {
    let dire = Direction::South;
    match dire {
        Direction::East => println!("East"),
        Direction::North | Direction::South => {
            println!("South or North");
        },
        _ => println!("West"),
    };
}
```

这里我们想去匹配 `dire` 对应的枚举类型，因此在 `match` 中用三个匹配分支来完全覆盖枚举变量 `Direction` 的所有成员类型，有以下几点值得注意：

- `match` 的匹配必须要穷举出所有可能，因此这里用 `_` 来代表未列出的所有可能性
- `match` 的每一个分支都必须是一个表达式，且所有分支的表达式最终返回值的类型必须相同
- **X | Y**，类似逻辑运算符 `或`，代表该分支可以匹配 `X` 也可以匹配 `Y`，只要满足一个即可

其实 `match` 跟其他语言中的 `switch` 非常像，`_` 类似于 `switch` 中的 `default`。

## 2.1 `match` 匹配

首先来看看 `match` 的通用形式：

```rust
match target {
    模式1 => 表达式1,
    模式2 => {
        语句1;
        语句2;
        表达式2
    },
    _ => 表达式3
}
```

该形式清晰的说明了何为模式，何为模式匹配：将模式与 `target` 进行匹配，即为模式匹配，而模式匹配不仅仅局限于 `match`，后面我们会详细阐述。

`match` 允许我们将一个值与一系列的模式相比较，并根据相匹配的模式执行对应的代码，下面让我们来一一详解，先看一个例子：

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny =>  {
            println!("Lucky penny!");
            1
        },
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

`value_in_cents` 函数根据匹配到的硬币，返回对应的美分数值。`match` 后紧跟着的是一个表达式，跟 `if` 很像，但是 `if` 后的表达式必须是一个布尔值，而 `match` 后的表达式返回值可以是任意类型，只要能跟后面的分支中的模式匹配起来即可，这里的 `coin` 是枚举 `Coin` 类型。

接下来是 `match` 的分支。一个分支有两个部分：**一个模式和针对该模式的处理代码**。第一个分支的模式是 `Coin::Penny`，其后的 `=>` 运算符将模式和将要运行的代码分开。这里的代码就仅仅是表达式 `1`，不同分支之间使用逗号分隔。

当 `match` 表达式执行时，它将目标值 `coin` 按顺序依次与每一个分支的模式相比较，如果模式匹配了这个值，那么模式之后的代码将被执行。如果模式并不匹配这个值，将继续执行下一个分支。

每个分支相关联的代码是一个表达式，而表达式的结果值将作为整个 `match` 表达式的返回值。如果分支有多行代码，那么需要用 `{}` 包裹，同时最后一行代码需要是一个表达式。

#### 2.1.1 使用 `match` 表达式赋值

还有一点很重要，`match` 本身也是一个表达式，因此可以用它来赋值：

```rust
enum IpAddr {
   Ipv4,
   Ipv6
}

fn main() {
    let ip1 = IpAddr::Ipv6;
    let ip_str = match ip1 {
        IpAddr::Ipv4 => "127.0.0.1",
        _ => "::1",
    };

    println!("{}", ip_str);
}
```

因为这里匹配到 `_` 分支，所以将 `"::1"` 赋值给了 `ip_str`。

#### 2.1.2 模式绑定

模式匹配的另外一个重要功能是从模式中取出绑定的值，例如：

```rust

#![allow(unused)]
fn main() {
    #[derive(Debug)]
    enum UsState {
        Alabama,
        Alaska,
        // --snip--
    }

    enum Coin {
        Penny,
        Nickel,
        Dime,
        Quarter(UsState), // 25美分硬币
    }
}

```

其中 `Coin::Quarter` 成员还存放了一个值：美国的某个州（因为在 1999 年到 2008 年间，美国在 25 美分(Quarter)硬币的背后为 50 个州印刷了不同的标记，其它硬币都没有这样的设计）。

接下来，我们希望在模式匹配中，获取到 25 美分硬币上刻印的州的名称：

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        },
    }
}
```

上面代码中，在匹配 `Coin::Quarter(state)` 模式时，我们把它内部存储的值绑定到了 `state` 变量上，因此 `state` 变量就是对应的 `UsState` 枚举类型。

例如有一个印了阿拉斯加州标记的 25 分硬币：`Coin::Quarter(UsState::Alaska)`, 它在匹配时，`state` 变量将被绑定 `UsState::Alaska` 的枚举值。

再来看一个更复杂的例子：

```rust
enum Action {
    Say(String),
    MoveTo(i32, i32),
    ChangeColorRGB(u16, u16, u16),
}

fn main() {
    let actions = [
        Action::Say("Hello Rust".to_string()),
        Action::MoveTo(1,2),
        Action::ChangeColorRGB(255,255,0),
    ];
    for action in actions {
        match action {
            Action::Say(s) => {
                println!("{}", s);
            },
            Action::MoveTo(x, y) => {
                println!("point from (0, 0) move to ({}, {})", x, y);
            },
            Action::ChangeColorRGB(r, g, _) => {
                println!("change color into '(r:{}, g:{}, b:0)', 'b' has been ignored",
                    r, g,
                );
            }
        }
    }
}

```

运行后输出：

```console
$ cargo run
   Compiling world_hello v0.1.0 (/Users/sunfei/development/rust/world_hello)
    Finished dev [unoptimized + debuginfo] target(s) in 0.16s
     Running `target/debug/world_hello`
Hello Rust
point from (0, 0) move to (1, 2)
change color into '(r:255, g:255, b:0)', 'b' has been ignored
```

#### 2.1.3 穷尽匹配

在文章的开头，我们简单总结过 `match` 的匹配必须穷尽所有情况，下面来举例说明，例如：

```rust
enum Direction {
    East,
    West,
    North,
    South,
}

fn main() {
    let dire = Direction::South;
    match dire {
        Direction::East => println!("East"),
        Direction::North | Direction::South => {
            println!("South or North");
        },
    };
}
```

我们没有处理 `Direction::West` 的情况，因此会报错：

```console
error[E0004]: non-exhaustive patterns: `West` not covered // 非穷尽匹配，`West` 没有被覆盖
  --> src/main.rs:10:11
   |
1  | / enum Direction {
2  | |     East,
3  | |     West,
   | |     ---- not covered
4  | |     North,
5  | |     South,
6  | | }
   | |_- `Direction` defined here
...
10 |       match dire {
   |             ^^^^ pattern `West` not covered // 模式 `West` 没有被覆盖
   |
   = help: ensure that all possible cases are being handled, possibly by adding wildcards or more match arms
   = note: the matched value is of type `Direction`
```

不禁想感叹，Rust 的编译器**真强大**，忍不住想爆粗口了，sorry，如果你以后进一步深入使用 Rust 也会像我这样感叹的。Rust 编译器清晰地知道 `match` 中有哪些分支没有被覆盖, 这种行为能强制我们处理所有的可能性，有效避免传说中价值**十亿美金**的 `null` 陷阱。

#### 2.1.4 `_` 通配符

当我们不想在匹配的时候列出所有值的时候，可以使用 Rust 提供的一个特殊**模式**，例如，`u8` 可以拥有 0 到 255 的有效的值，但是我们只关心 `1、3、5 和 7` 这几个值，不想列出其它的 `0、2、4、6、8、9 一直到 255` 的值。那么, 我们不必一个一个列出所有值, 因为可以使用特殊的模式 `_` 替代：

```rust
let some_u8_value = 0u8;
match some_u8_value {
    1 => println!("one"),
    3 => println!("three"),
    5 => println!("five"),
    7 => println!("seven"),
    _ => (),
}
```

通过将 `_` 其放置于其他分支后，`_` 将会匹配所有遗漏的值。`()` 表示返回**单元类型**与所有分支返回值的类型相同，所以当匹配到 `_` 后，什么也不会发生。

然后，在某些场景下，我们其实只关心**某一个值是否存在**，此时 `match` 就显得过于啰嗦。

## 2.2 `if let` 匹配

有时会遇到只有一个模式的值需要被处理，其它值直接忽略的场景，如果用 `match` 来处理就要写成下面这样：

```rust
    let v = Some(3u8);
    match v {
        Some(3) => println!("three"),
        _ => (),
    }
```

我们只想要对 `Some(3)` 模式进行匹配, 不想处理任何其他 `Some<u8>` 值或 `None` 值。但是为了满足 `match` 表达式（穷尽性）的要求，写代码时必须在处理完这唯一的成员后加上 `_ => ()`，这样会增加不少无用的代码。

杀鸡焉用牛刀，可以用 `if let` 的方式来实现：

```rust

#![allow(unused)]
fn main() {
    let v = Some(3u8);
    if let Some(3) = v {
        println!("three");
    }
}

```

这两种匹配对于新手来说，可能有些难以抉择，但是只要记住一点就好：**当你只要匹配一个条件，且忽略其他条件时就用 `if let` ，否则都用 `match`**。

## 2.3 matches!宏

Rust 标准库中提供了一个非常实用的宏：`matches!`，它可以将一个表达式跟模式进行匹配，然后返回匹配的结果 `true` or `false`。

例如，有一个动态数组，里面存有以下枚举：

```rust
enum MyEnum {
    Foo,
    Bar
}

fn main() {
    let v = vec![MyEnum::Foo,MyEnum::Bar,MyEnum::Foo];
}
```

现在如果想对 `v` 进行过滤，只保留类型是 `MyEnum::Foo` 的元素，你可能想这么写：

```rust
v.iter().filter(|x| x == MyEnum::Foo);
```

但是，实际上这行代码会报错，因为你无法将 `x` 直接跟一个枚举成员进行比较。好在，你可以使用 `match` 来完成，但是会导致代码更为啰嗦，是否有更简洁的方式？答案是使用 `matches!`：

```rust
v.iter().filter(|x| matches!(x, MyEnum::Foo));
```

很简单也很简洁，再来看看更多的例子：

```rust
let foo = 'f';
assert!(matches!(foo, 'A'..='Z' | 'a'..='z'));

let bar = Some(4);
assert!(matches!(bar, Some(x) if x > 2));
```

## 2.4 变量覆盖

无论是 `match` 还是 `if let`，他们都可以在模式匹配时覆盖掉老的值，绑定新的值:

```rust
fn main() {
   let age = Some(30);
   println!("在匹配前，age是{:?}",age);
   if let Some(age) = age {
       println!("匹配出来的age是{}",age);
   }

   println!("在匹配后，age是{:?}",age);
}
```

`cargo run `运行后输出如下：

```console
在匹配前，age是Some(30)
匹配出来的age是30
在匹配后，age是Some(30)
```

可以看出在 `if let` 中，`=` 右边 `Some(i32)` 类型的 `age` 被左边 `i32` 类型的新 `age` 覆盖了，该覆盖一直持续到 `if let` 语句块的结束。因此第三个 `println!` 输出的 `age` 依然是 `Some(i32)` 类型。

对于 `match` 类型也是如此:

```rust
fn main() {
   let age = Some(30);
   println!("在匹配前，age是{:?}",age);
   match age {
       Some(age) =>  println!("匹配出来的age是{}",age),
       _ => ()
   }
   println!("在匹配后，age是{:?}",age);
}
```

需要注意的是，**`match` 中的变量覆盖其实不是那么的容易看出**，因此要小心！


## 课后练习

> [Rust By Practice](https://zh.practice.rs/pattern-match/match-iflet.html)，支持代码在线编辑和运行，并提供详细的[习题解答](https://github.com/sunface/rust-by-practice)。





# 3 模式适用场景

## 3.1 模式

模式是 Rust 中的特殊语法，它用来匹配类型中的结构和数据，它往往和 `match` 表达式联用，以实现强大的模式匹配能力。模式一般由以下内容组合而成：

- 字面值
- 解构的数组、枚举、结构体或者元组
- 变量
- 通配符
- 占位符

## 3.2 所有可能用到模式的地方

### 3.2.1 match 分支

```rust
match VALUE {
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
}
```

如上所示，`match` 的每个分支就是一个**模式**，因为 `match` 匹配是穷尽式的，因此我们往往需要一个特殊的模式 `_`，来匹配剩余的所有情况：

```rust
match VALUE {
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
    _ => EXPRESSION,
}
```

### 3.2.2 if let 分支

`if let` 往往用于匹配一个模式，而忽略剩下的所有模式的场景：

```rust
if let PATTERN = SOME_VALUE {

}
```

### 3.2.3 while let 条件循环

一个与 `if let` 类似的结构是 `while let` 条件循环，**它允许只要模式匹配就一直进行 `while` 循环**。下面展示了一个使用 `while let` 的例子：

```rust

#![allow(unused)]
fn main() {
    // Vec是动态数组
    let mut stack = Vec::new();

    // 向数组尾部插入元素
    stack.push(1);
    stack.push(2);
    stack.push(3);

    // stack.pop从数组尾部弹出元素
    while let Some(top) = stack.pop() {
        println!("{}", top);
    }
}

```

这个例子会打印出 `3`、`2` 接着是 `1`。`pop` 方法取出动态数组的最后一个元素并返回 `Some(value)`，如果动态数组是空的，将返回 `None`，对于 `while` 来说，只要 `pop` 返回 `Some` 就会一直不停的循环。一旦其返回 `None`，`while` 循环停止。我们可以使用 `while let` 来弹出栈中的每一个元素。

你也可以用 `loop` + `if let` 或者 `match` 来实现这个功能，但是会更加啰嗦。

### 3.2.4 for 循环

```rust

#![allow(unused)]
fn main() {
    let v = vec!['a', 'b', 'c'];

    for (index, value) in v.iter().enumerate() {
        println!("{} is at index {}", value, index);
    }
}

```

这里使用 `enumerate` 方法产生一个迭代器，该迭代器每次迭代会返回一个 `(索引，值)` 形式的元组，然后用 `(index,value)` 来匹配。

### 3.2.5 let 语句

```rust
let PATTERN = EXPRESSION;
```

是的， 该语句我们已经用了无数次了，它也是一种模式匹配：

```rust
let x = 5;
```

这其中，`x` 也是一种模式绑定，代表将**匹配的值绑定到变量 x 上**。因此，在 Rust 中,**变量名也是一种模式**，只不过它比较朴素很不起眼罢了。

```rust
let (x, y, z) = (1, 2, 3);
```

上面将一个元组与模式进行匹配(**模式和值的类型必需相同！**)，然后把 `1, 2, 3` 分别绑定到 `x, y, z` 上。

模式匹配要求两边的类型必须相同，否则就会导致下面的报错：

```rust
let (x, y) = (1, 2, 3);
error[E0308]: mismatched types
 --> src/main.rs:4:5
  |
4 | let (x, y) = (1, 2, 3);
  |     ^^^^^^   --------- this expression has type `({integer}, {integer}, {integer})`
  |     |
  |     expected a tuple with 3 elements, found one with 2 elements
  |
  = note: expected tuple `({integer}, {integer}, {integer})`
             found tuple `(_, _)`
For more information about this error, try `rustc --explain E0308`.
error: could not compile `playground` due to previous error
```

对于元组来说，元素个数也是类型的一部分！

### 3.2.6 函数参数

函数参数也是模式：

```rust
fn foo(x: i32) {
    // 代码
}
```

其中 `x` 就是一个模式，你还可以在参数中匹配元组：

```rust
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("Current location: ({}, {})", x, y);
}

fn main() {
    let point = (3, 5);
    print_coordinates(&point);
}
```

`&(3, 5)` 会匹配模式 `&(x, y)`，因此 `x` 得到了 `3`，`y` 得到了 `5`。

### 3.2.7 if 和 if let

对于以下代码，编译器会报错：

```rust
let Some(x) = some_option_value;
```

因为右边的值可能不为 `Some`，而是 `None`，这种时候就不能进行匹配，也就是上面的代码遗漏了 `None` 的匹配。

类似 `let` 和 `for`、`match` 都必须要求完全覆盖匹配，才能通过编译( 不可驳模式匹配 )。

但是对于 `if let`，就可以这样使用：

```rust
if let Some(x) = some_option_value {
    println!("{}", x);
}
```

因为 `if let` 允许匹配一种模式，而忽略其余的模式( 可驳模式匹配 )。



# 4 全模式列表

在本书中我们已领略过许多不同类型模式的例子，本节的目标就是把这些模式语法都罗列出来，方便大家检索查阅（模式匹配在我们的开发中会经常用到）。

## 4.1 匹配字面值

```rust
let x = 1;

match x {
    1 => println!("one"),
    2 => println!("two"),
    3 => println!("three"),
    _ => println!("anything"),
}
```

这段代码会打印 `one` 因为 `x` 的值是 1，如果希望代码获得特定的具体值，那么这种语法很有用。

## 4.2 匹配命名变量

在 [match](https://course.rs/match-if-let.html#变量覆盖) 中，我们有讲过变量覆盖的问题，这个在**匹配命名变量**时会遇到：

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(y) => println!("Matched, y = {:?}", y),
        _ => println!("Default case, x = {:?}", x),
    }

    println!("at the end: x = {:?}, y = {:?}", x, y);
}
```

让我们看看当 `match` 语句运行的时候发生了什么。第一个匹配分支的模式并不匹配 `x` 中定义的值，所以代码继续执行。

第二个匹配分支中的模式引入了一个新变量 `y`，它会匹配任何 `Some` 中的值。因为这里的 `y` 在 `match` 表达式的作用域中，而不是之前 `main` 作用域中，所以这是一个新变量，不是开头声明为值 10 的那个 `y`。**这个新的 `y` 绑定会匹配任何 `Some` 中的值，在这里是 `x` 中的值。因此这个 `y` 绑定了 `x` 中 `Some` 内部的值。这个值是 5，所以这个分支的表达式将会执行并打印出 `Matched，y = 5`。**

如果 `x` 的值是 `None` 而不是 `Some(5)`，头两个分支的模式不会匹配，所以会匹配模式 `_`。这个分支的模式中没有引入变量 `x`，所以此时表达式中的 `x` 会是外部没有被覆盖的 `x`，也就是 `Some(5)`。

一旦 `match` 表达式执行完毕，其作用域也就结束了，**同理内部 `y` 的作用域也结束了**。最后的 `println!` 会打印 `at the end: x = Some(5), y = 10`。

如果你不想引入变量覆盖，那么需要使用匹配守卫(match guard)的方式，稍后在[匹配守卫提供的额外条件](#匹配守卫提供的额外条件)中会讲解。

## 4.3 单分支多模式

在 `match` 表达式中，可以使用 `|` 语法匹配多个模式，它代表 **或**的意思。例如，如下代码将 `x` 的值与匹配分支相比较，第一个分支有 **或** 选项，意味着如果 `x` 的值匹配此分支的任何一个模式，它就会运行：

```rust

#![allow(unused)]
fn main() {
    let x = 1;

    match x {
        1 | 2 => println!("one or two"),
        3 => println!("three"),
        _ => println!("anything"),
    }
}
```

上面的代码会打印 `one or two`。

## 4.4 通过序列 `..=` 匹配值的范围

在[数值类型](https://course.rs/basic/base-type/numbers.html#序列range)中我们有讲到一个序列语法，该语法不仅可以用循环中，还能用于匹配模式。

`..=` 语法允许你匹配一个闭区间序列内的值。在如下代码中，当模式匹配任何在此序列内的值时，该分支会执行：

```rust

#![allow(unused)]
fn main() {
    let x = 5;

    match x {
        1..=5 => println!("one through five"),
        _ => println!("something else"),
    }
}

```

如果 `x` 是 1、2、3、4 或 5，第一个分支就会匹配。这相比使用 `|` 运算符表达相同的意思更为方便；相比 `1..=5`，使用 `|` 则不得不指定 `1 | 2 | 3 | 4 | 5` 这五个值，而使用 `..=` 指定序列就简短的多，比如希望匹配比如从 1 到 1000 的数字的时候！

序列只允许用于数字或字符类型，原因是：它们可以连续，同时编译器在编译期可以检查该序列是否为空，字符和数字值是 Rust 中仅有的可以用于判断是否为空的类型。

如下是一个使用字符类型序列的例子：

```rust
let x = 'c';

match x {
    'a'..='j' => println!("early ASCII letter"),
    'k'..='z' => println!("late ASCII letter"),
    _ => println!("something else"),
}
```

Rust 知道 `'c'` 位于第一个模式的序列内，所以会打印出 `early ASCII letter`。

## 4.5 解构并分解值

也可以使用模式来解构结构体、枚举、元组和引用。

### 4.5.1 解构结构体

下面代码展示了如何用 `let` 解构一个带有两个字段 `x` 和 `y` 的结构体 `Point`：

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(7, b);
}
```

这段代码创建了变量 `a` 和 `b` 来匹配结构体 `p` 中的 `x` 和 `y` 字段，这个例子展示了**模式中的变量名不必与结构体中的字段名一致**。不过通常希望变量名与字段名一致以便于理解变量来自于哪些字段。

因为变量名匹配字段名是常见的，同时因为 `let Point { x: x, y: y } = p;` 中 `x` 和 `y` 重复了，所以对于匹配结构体字段的模式存在简写：只需列出结构体字段的名称，则模式创建的变量会有相同的名称。下例与上例有着相同行为的代码，不过 `let` 模式创建的变量为 `x` 和 `y` 而不是 `a` 和 `b`：

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x, y } = p;
    assert_eq!(0, x);
    assert_eq!(7, y);
}
```

这段代码创建了变量 `x` 和 `y`，与结构体 `p` 中的 `x` 和 `y` 字段相匹配。其结果是变量 `x` 和 `y` 包含结构体 `p` 中的值。

也可以使用字面值作为结构体模式的一部分进行解构，而不是为所有的字段创建变量。这允许我们测试一些字段为特定值的同时创建其他字段的变量。

下文展示了固定某个字段的匹配方式：

```rust
# struct Point {
#     x: i32,
#     y: i32,
# }
#
fn main() {
    let p = Point { x: 0, y: 7 };

    match p {
        Point { x, y: 0 } => println!("On the x axis at {}", x),
        Point { x: 0, y } => println!("On the y axis at {}", y),
        Point { x, y } => println!("On neither axis: ({}, {})", x, y),
    }
}
```

首先是 `match` 第一个分支，指定匹配 `y` 为 `0` 的 `Point`；
然后第二个分支在第一个分支之后，匹配 `y` 不为 `0`，`x` 为 `0` 的 `Point`;
最后一个分支匹配 `x` 不为 `0`，`y` 也不为 `0` 的 `Point`。

在这个例子中，值 `p` 因为其 `x` 包含 0 而匹配第二个分支，因此会打印出 `On the y axis at 7`。

### 4.5.2 解构枚举

下面代码以 `Message` 枚举为例，编写一个 `match` 使用模式解构每一个内部值：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => {
            println!("The Quit variant has no data to destructure.")
        }
        Message::Move { x, y } => {
            println!(
                "Move in the x direction {} and in the y direction {}",
                x,
                y
            );
        }
        Message::Write(text) => println!("Text message: {}", text),
        Message::ChangeColor(r, g, b) => {
            println!(
                "Change the color to red {}, green {}, and blue {}",
                r,
                g,
                b
            )
        }
    }
}
```

这里老生常谈一句话，模式匹配一样要类型相同，因此匹配 `Message::Move{1,2}` 这样的枚举值，就必须要用 `Message::Move{x,y}` 这样的同类型模式才行。

这段代码会打印出 `Change the color to red 0, green 160, and blue 255`。尝试改变 `msg` 的值来观察其他分支代码的运行。

对于像 `Message::Quit` 这样没有任何数据的枚举成员，不能进一步解构其值。只能匹配其字面值 `Message::Quit`，因此模式中没有任何变量。

对于另外两个枚举成员，就用相同类型的模式去匹配出对应的值即可。

### 4.5.3 解构嵌套的结构体和枚举

目前为止，所有的例子都只匹配了深度为一级的结构体或枚举。 `match` 也可以匹配嵌套的项！

例如使用下面的代码来同时支持 RGB 和 HSV 色彩模式：

```rust
enum Color {
   Rgb(i32, i32, i32),
   Hsv(i32, i32, i32),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

fn main() {
    let msg = Message::ChangeColor(Color::Hsv(0, 160, 255));

    match msg {
        Message::ChangeColor(Color::Rgb(r, g, b)) => {
            println!(
                "Change the color to red {}, green {}, and blue {}",
                r,
                g,
                b
            )
        }
        Message::ChangeColor(Color::Hsv(h, s, v)) => {
            println!(
                "Change the color to hue {}, saturation {}, and value {}",
                h,
                s,
                v
            )
        }
        _ => ()
    }
}
```

`match` 第一个分支的模式匹配一个 `Message::ChangeColor` 枚举成员，该枚举成员又包含了一个 `Color::Rgb` 的枚举成员，最终绑定了 3 个内部的 `i32` 值。第二个，就交给亲爱的读者来思考完成。

### 4.5.4 解构结构体和元组

我们甚至可以用复杂的方式来混合、匹配和嵌套解构模式。如下是一个复杂结构体的例子，其中结构体和元组嵌套在元组中，并将所有的原始类型解构出来：

```rust

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
```

这种将复杂类型分解匹配的方式，可以让我们单独得到感兴趣的某个值。

## 4.6 忽略模式中的值

有时忽略模式中的一些值是很有用的，比如在 `match` 中的最后一个分支使用 `_` 模式匹配所有剩余的值。 你也可以在另一个模式中使用 `_` 模式，使用一个以下划线开始的名称，或者使用 `..` 忽略所剩部分的值。

### 4.6.1 使用 `_` 忽略整个值

虽然 `_` 模式作为 `match` 表达式最后的分支特别有用，但是它的作用还不限于此。例如可以将其用于函数参数中：

```rust
fn foo(_: i32, y: i32) {
    println!("This code only uses the y parameter: {}", y);
}

fn main() {
    foo(3, 4);
}
```

这段代码会完全忽略作为第一个参数传递的值 `3`，并会打印出 `This code only uses the y parameter: 4`。

大部分情况当你不再需要特定函数参数时，最好修改签名不再包含无用的参数。在一些情况下忽略函数参数会变得特别有用，比如实现特征时，当你需要特定类型签名但是函数实现并不需要某个参数时。此时编译器就**不会警告说存在未使用的函数参数**，就跟使用命名参数一样。

### 4.6.2 使用嵌套的 `_` 忽略部分值

可以在一个模式内部使用 `_` 忽略部分值：

```rust

#![allow(unused)]
fn main() {
    let mut setting_value = Some(5);
    let new_setting_value = Some(10);

    match (setting_value, new_setting_value) {
        (Some(_), Some(_)) => {
            println!("Can't overwrite an existing customized value");
        }
        _ => {
            setting_value = new_setting_value;
        }
    }

    println!("setting is {:?}", setting_value);
}
```

这段代码会打印出 `Can't overwrite an existing customized value` 接着是 `setting is Some(5)`。

第一个匹配分支，我们不关心里面的值，只关心元组中两个元素的类型，因此对于 `Some` 中的值，直接进行忽略。
剩下的形如 `(Some(_),None)`，`(None, Some(_))`, `(None,None)` 形式，都由第二个分支 `_` 进行分配。

还可以在一个模式中的多处使用下划线来忽略特定值，如下所示，这里忽略了一个五元元组中的第二和第四个值：

```rust

#![allow(unused)]
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, _, third, _, fifth) => {
            println!("Some numbers: {}, {}, {}", first, third, fifth)
        },
    }
}

```

老生常谈：模式匹配一定要类型相同，因此匹配 `numbers` 元组的模式，也必须有五个值（元组中元素的数量也属于元组类型的一部分）。

这会打印出 `Some numbers: 2, 8, 32`, 值 4 和 16 会被忽略。

### 4.6.3 使用下划线开头忽略未使用的变量

如果你创建了一个变量却不在任何地方使用它，Rust 通常会给你一个警告，因为这可能会是个 BUG。但是有时创建一个不会被使用的变量是有用的，比如你正在设计原型或刚刚开始一个项目。这时你希望告诉 Rust 不要警告未使用的变量，为此可以用**下划线作为变量名的开头**：

```rust
fn main() {
    let _x = 5;
    let y = 10;
}
```

这里得到了警告说未使用变量 `y`，至于 `x` 则没有警告。

注意, 只使用 `_` 和使用以下划线开头的名称有些微妙的不同：比如 **`_x` 仍会将值绑定到变量，而 `_` 则完全不会绑定**。

```rust

#![allow(unused)]
fn main() {
    let s = Some(String::from("Hello!"));

    if let Some(_s) = s {
        println!("found a string");
    }

    println!("{:?}", s);
}

```

`s` 是一个拥有所有权的动态字符串，在上面代码中，我们会得到一个错误，因为 `s` 的值会被转移给 `_s`，在 `println!` 中再次使用 `s` 会报错：

```console
error[E0382]: borrow of partially moved value: `s`
 --> src/main.rs:8:22
  |
4 |     if let Some(_s) = s {
  |                 -- value partially moved here
...
8 |     println!("{:?}", s);
  |                      ^ value borrowed here after partial move
```

只使用下划线本身，则并不会绑定值，因为 `s` 没有被移动进 `_`：

```rust
let s = Some(String::from("Hello!"));

if let Some(_) = s {
    println!("found a string");
}

println!("{:?}", s);
```

### 4.6.4 用 `..` 忽略剩余值

对于有多个部分的值，可以使用 `..` 语法来只使用部分值而忽略其它值，这样也不用再为每一个被忽略的值都单独列出下划线。`..` 模式会忽略模式中剩余的任何没有显式匹配的值部分。

```rust

#![allow(unused)]
fn main() {
    struct Point {
        x: i32,
        y: i32,
        z: i32,
    }

    let origin = Point { x: 0, y: 0, z: 0 };

    match origin {
        Point { x, .. } => println!("x is {}", x),
    }
}

```

这里列出了 `x` 值，接着使用了 `..` 模式来忽略其它字段，这样的写法要比一一列出其它字段，然后用 `_` 忽略简洁的多。

还可以用 `..` 来忽略元组中间的某些值：

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, .., last) => {
            println!("Some numbers: {}, {}", first, last);
        },
    }
}
```

这里用 `first` 和 `last` 来匹配第一个和最后一个值。`..` 将匹配并忽略中间的所有值。

然而使用 `..` 必须是无歧义的。如果期望匹配和忽略的值是不明确的，Rust 会报错。下面代码展示了一个带有歧义的 `..` 例子，因此不能编译：

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (.., second, ..) => {
            println!("Some numbers: {}", second)
        },
    }
}
```

如果编译上面的例子，会得到下面的错误：

```text
error: `..` can only be used once per tuple pattern // 每个元组模式只能使用一个 `..`
 --> src/main.rs:5:22
  |
5 |         (.., second, ..) => {
  |          --          ^^ can only be used once per tuple pattern
  |          |
  |          previously used here // 上一次使用在这里

error: could not compile `world_hello` due to previous error              ^^
```

Rust 无法判断，`second` 应该匹配 `numbers` 中的第几个元素，因此这里使用两个 `..` 模式，是有很大歧义的！

## 4.7 匹配守卫提供的额外条件

**匹配守卫**（_match guard_）是一个位于 `match` 分支模式之后的额外 `if` 条件，它能为分支模式提供更进一步的匹配条件。

这个条件可以使用模式中创建的变量：

```rust

#![allow(unused)]
fn main() {
    let num = Some(4);

    match num {
        Some(x) if x < 5 => println!("less than five: {}", x),
        Some(x) => println!("{}", x),
        None => (),
    }
}

```

这个例子会打印出 `less than five: 4`。当 `num` 与模式中第一个分支匹配时，`Some(4)` 可以与 `Some(x)` 匹配，接着匹配守卫检查 `x` 值是否小于 5，因为 4 小于 5，所以第一个分支被选择。

相反如果 `num` 为 `Some(10)`，因为 10 不小于 5 ，所以第一个分支的匹配守卫为假。接着 Rust 会前往第二个分支，因为这里没有匹配守卫所以会匹配任何 `Some` 成员。

模式中无法提供类如 `if x < 5` 的表达能力，我们可以通过匹配守卫的方式来实现。

在之前，我们提到可以使用匹配守卫来解决模式中变量覆盖的问题，那里 `match` 表达式的模式中新建了一个变量而不是使用 `match` 之外的同名变量。内部变量覆盖了外部变量，意味着此时不能够使用外部变量的值，下面代码展示了如何使用匹配守卫修复这个问题。

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(n) if n == y => println!("Matched, n = {}", n),
        _ => println!("Default case, x = {:?}", x),
    }

    println!("at the end: x = {:?}, y = {}", x, y);
}
```

现在这会打印出 `Default case, x = Some(5)`。现在第二个匹配分支中的模式不会引入一个覆盖外部 `y` 的新变量 `y`，这意味着可以在匹配守卫中使用外部的 `y`。相比指定会覆盖外部 `y` 的模式 `Some(y)`，这里指定为 `Some(n)`。此新建的变量 `n` 并没有覆盖任何值，因为 `match` 外部没有变量 `n`。

匹配守卫 `if n == y` 并不是一个模式所以没有引入新变量。这个 `y` **正是** 外部的 `y` 而不是新的覆盖变量 `y`，这样就可以通过比较 `n` 和 `y` 来表达寻找一个与外部 `y` 相同的值的概念了。

也可以在匹配守卫中使用 **或** 运算符 `|` 来指定多个模式，**同时匹配守卫的条件会作用于所有的模式**。下面代码展示了匹配守卫与 `|` 的优先级。这个例子中看起来好像 `if y` 只作用于 `6`，但实际上匹配守卫 `if y` 作用于 `4`、`5` **和** `6` ，在满足 `x` 属于 `4 | 5 | 6` 后才会判断 `y` 是否为 `true`：

```rust
let x = 4;
let y = false;

match x {
    4 | 5 | 6 if y => println!("yes"),
    _ => println!("no"),
}
```

这个匹配条件表明此分支只匹配 `x` 值为 `4`、`5` 或 `6` **同时** `y` 为 `true` 的情况。

虽然在第一个分支中，`x` 匹配了模式 `4` ，但是对于匹配守卫 `if y` 来说，因为 `y` 是 `false`，因此该守卫条件的值永远是 `false`，也意味着第一个分支永远无法被匹配。

下面的文字图解释了匹配守卫作用于多个模式时的优先级规则，第一张是正确的：

```text
(4 | 5 | 6) if y => ...
```

而第二张图是错误的

```text
4 | 5 | (6 if y) => ...
```

可以通过运行代码时的情况看出这一点：如果匹配守卫只作用于由 `|` 运算符指定的值列表的最后一个值，这个分支就会匹配且程序会打印出 `yes`。

## 4.8 @绑定

`@`（读作 at）运算符允许**为一个字段绑定另外一个变量**。下面例子中，我们希望测试 `Message::Hello` 的 `id` 字段是否位于 `3..=7` 范围内，同时也希望能将其值绑定到 `id_variable` 变量中以便此分支中相关的代码可以使用它。我们可以将 `id_variable` 命名为 `id`，与字段同名，不过出于示例的目的这里选择了不同的名称。

```rust

#![allow(unused)]
fn main() {
    enum Message {
        Hello { id: i32 },
    }

    let msg = Message::Hello { id: 5 };

    match msg {
        Message::Hello { id: id_variable @ 3..=7 } => {
            println!("Found an id in range: {}", id_variable)
        },
        Message::Hello { id: 10..=12 } => {
            println!("Found an id in another range")
        },
        Message::Hello { id } => {
            println!("Found some other id: {}", id)
        },
    }
}

```

上例会打印出 `Found an id in range: 5`。通过在 `3..=7` 之前指定 `id_variable @`，我们捕获了任何匹配此范围的值并同时将该值绑定到变量 `id_variable` 上。

第二个分支只在模式中指定了一个范围，`id` 字段的值可以是 `10、11 或 12`，不过这个模式的代码并不知情也不能使用 `id` 字段中的值，因为没有将 `id` 值保存进一个变量。

最后一个分支指定了一个没有范围的变量，此时确实拥有可以用于分支代码的变量 `id`，因为这里使用了结构体字段简写语法。不过此分支中没有像头两个分支那样对 `id` 字段的值进行测试：任何值都会匹配此分支。

当你既想要限定分支范围，又想要使用分支的变量时，就可以用 `@` 来绑定到一个新的变量上，实现想要的功能。

#### @前绑定后解构(Rust 1.56 新增)

使用 `@` 还可以在绑定新变量的同时，对目标进行解构：

```rust
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    // 绑定新变量 `p`，同时对 `Point` 进行解构
    let p @ Point {x: px, y: py } = Point {x: 10, y: 23};
    println!("x: {}, y: {}", px, py);
    println!("{:?}", p);


    let point = Point {x: 10, y: 5};
    if let p @ Point {x: 10, y} = point {
        println!("x is 10 and y is {} in {:?}", y, p);
    } else {
        println!("x was not 10 :(");
    }
}
```

#### @新特性(Rust 1.53 新增)

考虑下面一段代码:

```rust
fn main() {
    match 1 {
        num @ 1 | 2 => {
            println!("{}", num);
        }
        _ => {}
    }
}
```

编译不通过，是因为 `num` 没有绑定到所有的模式上，只绑定了模式 `1`，你可能会试图通过这个方式来解决：

```rust
num @ (1 | 2)
```

但是，如果你用的是 Rust 1.53 之前的版本，那这种写法会报错，因为编译器不支持。

至此，模式匹配的内容已经全部完结，复杂但是详尽，想要一次性全部记住属实不易，因此读者可以先留一个印象，等未来需要时，再来翻阅寻找具体的模式实现方式。


## 4.9 课后练习

> [Rust By Practice](https://zh.practice.rs/pattern-match/patterns.html)，支持代码在线编辑和运行，并提供详细的[习题解答](https://github.com/sunface/rust-by-practice)。

# 5 **返回值和错误处理**



飞鸽传书、八百里加急，自古以来，掌权者最需要的就是及时获得对某个事物的信息反馈，在此过程中，也定义了相应的应急处理措施。



社会演变至今，这种思想依然没变，甚至来到计算中的微观世界，也是如此。及时、准确的获知系统在发生什么，是程序设计的重中之重。因此能够准确的分辨函数返回值是正确的还是错误的、以及在发生错误时该怎么快速处理，成了程序设计语言的必备功能。



Go 语言为人诟病的其中一点就是  ***if err != nil {}\***  的大量使用，缺乏一些程序设计的美感，不过我倒是觉得这种简单的方式也有其好处，就是阅读代码时的流畅感很强，你不需要过多的思考各种语法是什么意思。与 Go 语言不同，Rust 博采众家之长，实现了颇具自身色彩的返回值和错误处理体系，本章我们就高屋建瓴地来学习，更加深入的讲解见[错误处理](https://course.rs/advance/errors.html)。



## **5.1 Rust 的错误哲学**-Rust 没有异常



错误对于软件来说是不可避免的，因此一门优秀的编程语言必须有其完整的错误处理哲学。在很多情况下，Rust 需要你承认自己的代码可能会出错，并提前采取行动，来处理这些错误。



Rust 中的错误主要分为两类：

- **可恢复错误**，通常用于从系统全局角度来看可以接受的错误，例如处理用户的访问、操作等错误，这些错误只会影响某个用户自身的操作进程，而不会对系统的全局稳定性产生影响
- **不可恢复错误**，刚好相反，该错误通常是全局性或者系统性的错误，例如数组越界访问，系统启动时发生了影响启动流程的错误等等，这些错误的影响往往对于系统来说是致命的



很多编程语言，并不会区分这些错误，而是直接采用异常的方式去处理。**Rust 没有异常，**但是 Rust 也有自己的卧龙凤雏：`Result<T, E>` 用于可恢复错误，`panic!` 用于不可恢复错误。



## 5.2 panic 深入剖析

在正式开始之前，先来思考一个问题：假设我们想要从文件读取数据，如果失败，你有没有好的办法通知调用者为何失败？如果成功，你有没有好的办法把读取的结果返还给调用者？

### 5.2.1 panic! 与不可恢复错误

上面的问题在真实场景会经常遇到，其实处理起来挺复杂的，让我们先做一个假设：文件读取操作发生在系统启动阶段。那么可以轻易得出一个结论，一旦文件读取失败，那么系统启动也将失败，这意味着该失败是不可恢复的错误，无论是因为文件不存在还是操作系统硬盘的问题，这些只是错误的原因不同，但是归根到底都是不可恢复的错误(梳理清楚当前场景的错误类型非常重要)。

既然是不可恢复错误，那么一旦发生，只需让程序崩溃即可。对此，Rust 为我们提供了 `panic!` 宏，当调用执行该宏时，**程序会打印出一个错误信息，展开报错点往前的函数调用堆栈，最后退出程序**。

切记，**一定是不可恢复的错误，才调用 `panic!` 处理**，你总不想系统仅仅因为用户随便传入一个非法参数就崩溃吧？所以，**只有当你不知道该如何处理时，再去调用 panic!**.

### 5.2.1 调用 panic!

首先，来调用一下 `panic!`，这里使用了最简单的代码实现，实际上你在程序的任何地方都可以这样调用：

```rust
fn main() {
    panic!("crash and burn");
}
```

运行后输出:

```console
thread 'main' panicked at 'crash and burn', src/main.rs:2:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

以上信息包含了两条重要信息：

- `main` 函数所在的线程崩溃了，发生的代码位置是 `src/main.rs` 中的第 2 行第 5 个字符（去除该行前面的空字符）
- 在使用时加上一个环境变量可以获取更详细的栈展开信息：
  - Linux/macOS 等 UNIX 系统： `RUST_BACKTRACE=1 cargo run`
  - Windows 系统（PowerShell）： `$env:RUST_BACKTRACE=1 ; cargo run`

下面让我们针对第二点进行详细展开讲解。

### 5.2.3 backtrace 栈展开

在真实场景中，错误往往涉及到很长的调用链甚至会深入第三方库，如果没有栈展开技术，错误将难以跟踪处理，下面我们来看一个真实的崩溃例子：

```rust
fn main() {
    let v = vec![1, 2, 3];

    v[99];
}
```

上面的代码很简单，数组只有 `3` 个元素，我们却尝试去访问它的第 `100` 号元素(数组索引从 `0` 开始)，那自然会崩溃。

我们的读者里不乏正义之士，此时肯定要质疑，一个简单的数组越界访问，为何要直接让程序崩溃？是不是有些小题大作了？

如果有过 C 语言的经验，即使你越界了，问题不大，我依然尝试去访问，至于这个值是不是你想要的（`100` 号内存地址也有可能有值，只不过是其它变量或者程序的！），抱歉，不归我管，我只负责取，你要负责管理好自己的索引访问范围。上面这种情况被称为**缓冲区溢出**，并可能会导致安全漏洞，例如攻击者可以通过索引来访问到数组后面不被允许的数据。

说实话，我宁愿程序崩溃，为什么？当你取到了一个不属于你的值，这在很多时候会导致程序上的逻辑 BUG！ 有编程经验的人都知道这种逻辑上的 BUG 是多么难被发现和修复！因此程序直接崩溃，然后告诉我们问题发生的位置，最后我们对此进行修复，这才是最合理的软件开发流程，而不是把问题藏着掖着：

```console
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', src/main.rs:4:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

好的，现在成功知道问题发生的位置，但是如果我们想知道该问题之前经过了哪些调用环节，该怎么办？那就按照提示使用 `RUST_BACKTRACE=1 cargo run` 或 `$env:RUST_BACKTRACE=1 ; cargo run` 来再一次运行程序：

```console
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', src/main.rs:4:5
stack backtrace:
   0: rust_begin_unwind
             at /rustc/59eed8a2aac0230a8b53e89d4e99d55912ba6b35/library/std/src/panicking.rs:517:5
   1: core::panicking::panic_fmt
             at /rustc/59eed8a2aac0230a8b53e89d4e99d55912ba6b35/library/core/src/panicking.rs:101:14
   2: core::panicking::panic_bounds_check
             at /rustc/59eed8a2aac0230a8b53e89d4e99d55912ba6b35/library/core/src/panicking.rs:77:5
   3: <usize as core::slice::index::SliceIndex<[T]>>::index
             at /rustc/59eed8a2aac0230a8b53e89d4e99d55912ba6b35/library/core/src/slice/index.rs:184:10
   4: core::slice::index::<impl core::ops::index::Index<I> for [T]>::index
             at /rustc/59eed8a2aac0230a8b53e89d4e99d55912ba6b35/library/core/src/slice/index.rs:15:9
   5: <alloc::vec::Vec<T,A> as core::ops::index::Index<I>>::index
             at /rustc/59eed8a2aac0230a8b53e89d4e99d55912ba6b35/library/alloc/src/vec/mod.rs:2465:9
   6: world_hello::main
             at ./src/main.rs:4:5
   7: core::ops::function::FnOnce::call_once
             at /rustc/59eed8a2aac0230a8b53e89d4e99d55912ba6b35/library/core/src/ops/function.rs:227:5
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```

上面的代码就是一次栈展开(也称栈回溯)，它包含了函数调用的顺序，当然按照逆序排列：最近调用的函数排在列表的最上方。因为咱们的 `main` 函数基本是最先调用的函数了，所以排在了倒数第二位，还有一个关注点，排在最顶部最后一个调用的函数是 `rust_begin_unwind`，该函数的目的就是进行栈展开，呈现这些列表信息给我们。

要获取到栈回溯信息，你还需要开启 `debug` 标志，该标志在使用 `cargo run` 或者 `cargo build` 时自动开启（这两个操作默认是 `Debug` 运行方式）。同时，栈展开信息在不同操作系统或者 Rust 版本上也有所不同。

### 5.2.4 panic 时的两种终止方式

当出现 `panic!` 时，程序提供了两种方式来处理终止流程：**栈展开**和**直接终止**。

其中，默认的方式就是 `栈展开`，这意味着 Rust 会回溯栈上数据和函数调用，因此也意味着更多的善后工作，好处是可以给出充分的报错信息和栈调用信息，便于事后的问题复盘。`直接终止`，顾名思义，不清理数据就直接退出程序，善后工作交与操作系统来负责。

对于绝大多数用户，使用默认选择是最好的，但是当你关心最终编译出的二进制可执行文件大小时，那么可以尝试去使用直接终止的方式，例如下面的配置修改 `Cargo.toml` 文件，实现在 [`release`](https://course.rs/first-try/cargo.html#手动编译和运行项目) 模式下遇到 `panic` 直接终止：

```rust
[profile.release]
panic = 'abort'
```

### 5.2.5 线程 `panic` 后，程序是否会终止？

长话短说，如果是 `main` 线程，则程序会终止，如果是其它子线程，该线程会终止，但是不会影响 `main` 线程。因此，**尽量不要在 `main` 线程中做太多任务**，将这些任务交由子线程去做，就算子线程 `panic` 也不会导致整个程序的结束。

具体解析见 [panic 原理剖析](#panic-原理剖析)。

### 5.2.6 何时该使用 panic!

下面让我们大概罗列下何时适合使用 `panic`，也许经过之前的学习，你已经能够对 `panic` 的使用有了自己的看法，但是我们还是会罗列一些常见的用法来加深你的理解。

先来一点背景知识，在前面章节我们粗略讲过 `Result<T, E>` 这个枚举类型，它是用来表示函数的返回结果：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

当没有错误发生时，函数返回一个用 `Result` 类型包裹的值 `Ok(T)`，当错误时，返回一个 `Err(E)`。对于 `Result` 返回我们有很多处理方法，最简单粗暴的就是 `unwrap` 和 `expect`，这两个函数非常类似，我们以 `unwrap` 举例：

```rust
use std::net::IpAddr;
let home: IpAddr = "127.0.0.1".parse().unwrap();
```

上面的 `parse` 方法试图将字符串 `"127.0.0.1" `解析为一个 IP 地址类型 `IpAddr`，它返回一个 `Result<IpAddr, E>` 类型，如果解析成功，则把 `Ok(IpAddr)` 中的值赋给 `home`，如果失败，则不处理 `Err(E)`，而是直接 `panic`。

因此 `unwrap` 简而言之：成功则返回值，失败则 `panic`，总之不进行任何错误处理。



## 5.3 可恢复的错误 Result

还记得上一节中，提到的关于文件读取的思考题吧？当时我们解决了读取文件时遇到不可恢复错误该怎么处理的问题，现在来看看，读取过程中，正常返回和遇到可以恢复的错误时该如何处理。

假设，我们有一台消息服务器，每个用户都通过 websocket 连接到该服务器来接收和发送消息，该过程就涉及到 socket 文件的读写，那么此时，如果一个用户的读写发生了错误，显然不能直接 `panic`，否则服务器会直接崩溃，所有用户都会断开连接，因此我们需要一种更温和的错误处理方式：`Result<T, E>`。

之前章节有提到过，`Result<T, E>` 是一个枚举类型，定义如下：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

**泛型参数 `T` 代表成功时存入的正确值的类型，存放方式是 `Ok(T)`，`E` 代表错误是存入的错误值，存放方式是 `Err(E)`，**枯燥的讲解永远不及代码生动准确，因此先来看下打开文件的例子：

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");
}
```

以上 `File::open` 返回一个 `Result` 类型，那么问题来了：

> #### 如何获知变量类型或者函数的返回类型
>
> 有几种常用的方式，此处更推荐第二种方法：
>
> - 第一种是查询标准库或者三方库文档，搜索 `File`，然后找到它的 `open` 方法
> - 在 [Rust IDE](https://course.rs/first-try/editor.html) 章节，我们推荐了 `VSCode` IDE 和 `rust-analyzer` 插件，如果你成功安装的话，那么就可以在 `VSCode` 中很方便的通过代码跳转的方式查看代码，同时 `rust-analyzer` 插件还会对代码中的类型进行标注，非常方便好用！
> - 你还可以尝试故意标记一个错误的类型，然后让编译器告诉你：

```rust
let f: u32 = File::open("hello.txt");
```

错误提示如下：

```console
error[E0308]: mismatched types
 --> src/main.rs:4:18
  |
4 |     let f: u32 = File::open("hello.txt");
  |                  ^^^^^^^^^^^^^^^^^^^^^^^ expected u32, found enum
`std::result::Result`
  |
  = note: expected type `u32`
             found type `std::result::Result<std::fs::File, std::io::Error>`
```

上面代码，故意将 `f` 类型标记成整形，编译器立刻不乐意了，你是在忽悠我吗？打开文件操作返回一个整形？来，大哥来告诉你返回什么：`std::result::Result<std::fs::File, std::io::Error>`，我的天呐，怎么这么长的类型！

别慌，其实很简单，首先 `Result` 本身是定义在 `std::result` 中的，但是因为 `Result` 很常用，所以就被包含在了 [`prelude`](https://course.rs/appendix/prelude.html) 中（将常用的东东提前引入到当前作用域内），因此无需手动引入 `std::result::Result`，那么返回类型可以简化为 `Result<std::fs::File,std::io::Error>`，你看看是不是很像标准的 `Result<T, E>` 枚举定义？只不过 `T` 被替换成了具体的类型 `std::fs::File`，是一个文件句柄类型，`E` 被替换成 `std::io::Error`，是一个 IO 错误类型.

这个返回值类型说明 `File::open` 调用如果成功则返回一个可以进行读写的文件句柄，如果失败，则返回一个 IO 错误：文件不存在或者没有访问文件的权限等。总之 `File::open` 需要一个方式告知调用者是成功还是失败，并同时返回具体的文件句柄(成功)或错误信息(失败)，万幸的是，这些信息可以通过 `Result` 枚举提供：

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => {
            panic!("Problem opening the file: {:?}", error)
        },
    };
}
```

代码很清晰，对打开文件后的 `Result<T, E>` 类型进行匹配取值，如果是成功，则将 `Ok(file)` 中存放的的文件句柄 `file` 赋值给 `f`，如果失败，则将 `Err(error)` 中存放的错误信息 `error` 使用 `panic` 抛出来，进而结束程序，这非常符合上文提到过的 `panic` 使用场景。

好吧，也没有那么合理 :)

### 5.3.1 对返回的错误进行处理

直接 `panic` 还是过于粗暴，因为实际上 IO 的错误有很多种，我们需要对部分错误进行特殊处理，而不是所有错误都直接崩溃：

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {:?}", e),
            },
            other_error => panic!("Problem opening the file: {:?}", other_error),
        },
    };
}
```

上面代码在匹配出 `error` 后，又对 `error` 进行了详细的匹配解析，最终结果：

- 如果是文件不存在错误 `ErrorKind::NotFound`，就创建文件，这里创建文件`File::create` 也是返回 `Result`，因此继续用 `match` 对其结果进行处理：创建成功，将新的文件句柄赋值给 `f`，如果失败，则 `panic`
- 剩下的错误，一律 `panic`

虽然很清晰，但是代码还是有些啰嗦，我们会在[简化错误处理](https://course.rs/advance/errors.html)一章重点讲述如何写出更优雅的错误。

### 5.3.2 失败就 panic: unwrap 和 expect

上一节中，已经看到过这两兄弟的简单介绍，这里再来回顾下。

在不需要处理错误的场景，例如写原型、示例时，我们不想使用 `match` 去匹配 `Result<T, E> ` 以获取其中的 `T` 值，因为 `match` 的穷尽匹配特性，你总要去处理下 `Err` 分支。那么有没有办法简化这个过程？有，答案就是 `unwrap` 和 `expect`。

它们的作用就是，如果返回成功，就将 `Ok(T)` 中的值取出来，如果失败，就直接 `panic`，真的勇士绝不多 BB，直接崩溃。

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").unwrap();
}
```

如果调用这段代码时 _hello.txt_ 文件不存在，那么 `unwrap` 就将直接 `panic`：

```console
thread 'main' panicked at 'called `Result::unwrap()` on an `Err` value: Os { code: 2, kind: NotFound, message: "No such file or directory" }', src/main.rs:4:37
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

`expect` 跟 `unwrap` 很像，也是遇到错误直接 `panic`, 但是会带上自定义的错误提示信息，相当于重载了错误打印的函数：

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").expect("Failed to open hello.txt");
}
```

报错如下：

```console
thread 'main' panicked at 'Failed to open hello.txt: Os { code: 2, kind: NotFound, message: "No such file or directory" }', src/main.rs:4:37
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

可以看出，`expect` 相比 `unwrap` 能提供更精确的错误信息，在有些场景也会更加实用。

## 5.4 传播错误

咱们的程序几乎不太可能只有 `A->B` 形式的函数调用，一个设计良好的程序，一个功能涉及十几层的函数调用都有可能。而错误处理也往往不是哪里调用出错，就在哪里处理，实际应用中，大概率会把错误层层上传然后交给调用链的上游函数进行处理，错误传播将极为常见。

例如以下函数从文件中读取用户名，然后将结果进行返回：

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    // 打开文件，f是`Result<文件句柄,io::Error>`
    let f = File::open("hello.txt");

    let mut f = match f {
        // 打开文件成功，将file句柄赋值给f
        Ok(file) => file,
        // 打开文件失败，将错误返回(向上传播)
        Err(e) => return Err(e),
    };
    // 创建动态字符串s
    let mut s = String::new();
    // 从f文件句柄读取数据并写入s中
    match f.read_to_string(&mut s) {
        // 读取成功，返回Ok封装的字符串
        Ok(_) => Ok(s),
        // 将错误向上传播
        Err(e) => Err(e),
    }
}
```

有几点值得注意：

- 该函数返回一个 `Result<String, io::Error>` 类型，当读取用户名成功时，返回 `Ok(String)`，失败时，返回 `Err(io:Error)`
- `File::open` 和 `f.read_to_string` 返回的 `Result<T, E>` 中的 `E` 就是 `io::Error`

由此可见，该函数将 `io::Error` 的错误往上进行传播，该函数的调用者最终会对 `Result<String,io::Error>` 进行再处理，至于怎么处理就是调用者的事，如果是错误，它可以选择继续向上传播错误，也可以直接 `panic`，亦或将具体的错误原因包装后写入 socket 中呈现给终端用户。

但是上面的代码也有自己的问题，那就是太长了(优秀的程序员身上的优点极多，其中最大的优点就是*懒*)，我自认为也有那么一点点优秀，因此见不到这么啰嗦的代码，下面咱们来讲讲如何简化它。

### 5.4.1 传播界的大明星: ?

大明星出场，必需得有排面，来看看 `?` 的排面：

```rust
use std::fs::File;
use std::io;
use std::io::Read;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

看到没，这就是排面，相比前面的 `match` 处理错误的函数，代码直接减少了一半不止，但是，一山更比一山难，看不懂啊！

其实 `?` 就是一个宏，它的作用跟上面的 `match` 几乎一模一样：

```rust
let mut f = match f {
    // 打开文件成功，将file句柄赋值给f
    Ok(file) => file,
    // 打开文件失败，将错误返回(向上传播)
    Err(e) => return Err(e),
};
```

如果结果是 `Ok(T)`，则把 `T` 赋值给 `f`，如果结果是 `Err(E)`，则返回该错误，所以 `?` 特别适合用来传播错误。

虽然 `?` 和 `match` 功能一致，但是事实上 `?` 会更胜一筹。何解？

想象一下，一个设计良好的系统中，肯定有自定义的错误特征，错误之间很可能会存在上下级关系，例如标准库中的 `std::io::Error `和 `std::error::Error`，前者是 IO 相关的错误结构体，后者是一个最最通用的标准错误特征，同时前者实现了后者，因此 `std::io::Error` 可以转换为 `std:error::Error`。

明白了以上的错误转换，`?` 的更胜一筹就很好理解了，它可以自动进行类型提升（转换）：

```rust

#![allow(unused)]
fn main() {
    fn open_file() -> Result<File, Box<dyn std::error::Error>> {
        let mut f = File::open("hello.txt")?;
        Ok(f)
    }
}

```

上面代码中 `File::open` 报错时返回的错误是 `std::io::Error` 类型，但是 `open_file` 函数返回的错误类型是 `std::error::Error` 的特征对象，可以看到一个错误类型通过 `?` 返回后，变成了另一个错误类型，这就是 `?` 的神奇之处。

根本原因是在于标准库中定义的 `From` 特征，该特征有一个方法 `from`，用于把一个类型转成另外一个类型，`?` 可以自动调用该方法，然后进行隐式类型转换。因此只要函数返回的错误 `ReturnError` 实现了 `From<OtherError>` 特征，那么 `?` 就会自动把 `OtherError` 转换为 `ReturnError`。

这种转换非常好用，意味着你可以用一个大而全的 `ReturnError` 来覆盖所有错误类型，只需要为各种子错误类型实现这种转换即可。

强中自有强中手，一码更比一码短：

```rust
use std::fs::File;
use std::io;
use std::io::Read;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();

    File::open("hello.txt")?.read_to_string(&mut s)?;

    Ok(s)
}
```

瞧见没？ `?` 还能实现链式调用，`File::open` 遇到错误就返回，没有错误就将 `Ok` 中的值取出来用于下一个方法调用，简直太精妙了，从 Go 语言过来的我，内心狂喜（其实学 Rust 的苦和痛我才不会告诉你们）。

不仅有更强，还要有最强，我不信还有人比我更短(不要误解)：

```rust
use std::fs;
use std::io;

fn read_username_from_file() -> Result<String, io::Error> {
    // read_to_string是定义在std::io中的方法，因此需要在上面进行引用
    fs::read_to_string("hello.txt")
}
```

从文件读取数据到字符串中，是比较常见的操作，因此 Rust 标准库为我们提供了 `fs::read_to_string` 函数，该函数内部会打开一个文件、创建 `String`、读取文件内容最后写入字符串并返回，因为该函数其实与本章讲的内容关系不大，因此放在最后来讲，其实只是我想震你们一下 :)

### 5.4.2 ? 用于 Option 的返回

`?` 不仅仅可以用于 `Result` 的传播，还能用于 `Option` 的传播，再来回忆下 `Option` 的定义：

```rust
pub enum Option<T> {
    Some(T),
    None
}
```

`Result` 通过 `?` 返回错误，那么 `Option` 就通过 `?` 返回 `None`：

```rust

#![allow(unused)]
fn main() {
    fn first(arr: &[i32]) -> Option<&i32> {
       let v = arr.get(0)?;
       Some(v)
    }
}

```

上面的函数中，`arr.get` 返回一个 `Option<&i32>` 类型，因为 `?` 的使用，如果 `get` 的结果是 `None`，则直接返回 `None`，如果是 `Some(&i32)`，则把里面的值赋给 `v`。

其实这个函数有些画蛇添足，我们完全可以写出更简单的版本：

```rust
fn first(arr: &[i32]) -> Option<&i32> {
   arr.get(0)
}
```

有一句话怎么说？没有需求，制造需求也要上……大家别跟我学习，这是软件开发大忌。只能用代码洗洗眼了：

```rust
fn last_char_of_first_line(text: &str) -> Option<char> {
    text.lines().next()?.chars().last()
}
```

上面代码展示了在链式调用中使用 `?` 提前返回 `None` 的用法， `.next` 方法返回的是 `Option` 类型：如果返回 `Some(&str)`，那么继续调用 `chars` 方法,如果返回 `None`，则直接从整个函数中返回 `None`，不再继续进行链式调用。

### 5.4.3 新手用 ? 常会犯的错误

初学者在用 `?` 时，老是会犯错，例如写出这样的代码：

```rust
fn first(arr: &[i32]) -> Option<&i32> {
   arr.get(0)?
}
```

这段代码无法通过编译，切记：`?` 操作符需要一个变量来承载正确的值，这个函数只会返回 `Some(&i32)` 或者 `None`，只有错误值能直接返回，正确的值不行，所以如果数组中存在 0 号元素，那么函数第二行使用 `?` 后的返回类型为 `&i32` 而不是 `Some(&i32)`。因此 `?` 只能用于以下形式：

- `let v = xxx()?;`
- `xxx()?.yyy()?;`

### 5.4.4 带返回值的 main 函数

在了解了 `?` 的使用限制后，这段代码你很容易看出它无法编译：

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt")?;
}
```

因为 `?` 要求 `Result<T, E>` 形式的返回值，而 `main` 函数的返回是 `()`，因此无法满足，那是不是就无解了呢？

实际上 Rust 还支持另外一种形式的 `main` 函数：

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let f = File::open("hello.txt")?;

    Ok(())
}
```

这样就能使用 `?` 提前返回了，同时我们又一次看到了`Box<dyn Error>` 特征对象，因为 `std::error:Error` 是 **Rust 中抽象层次最高的错误，其它标准库中的错误都实现了该特征，因此我们可以用该特征对象代表一切错误**，就算 `main` 函数中调用任何标准库函数发生错误，都可以通过 `Box<dyn Error>` 这个特征对象进行返回.

至于 `main` 函数可以有多种返回值，那是因为实现了 [std::process::Termination](https://doc.rust-lang.org/std/process/trait.Termination.html) 特征，目前为止该特征还没进入稳定版 Rust 中，也许未来你可以为自己的类型实现该特征！

### 5.4.5 try! 这个了解就行

在 `?` 横空出世之前( Rust 1.13 )，Rust 开发者还可以使用 `try!` 来处理错误，该宏的大致定义如下：

```rust
macro_rules! try {
    ($e:expr) => (match $e {
        Ok(val) => val,
        Err(err) => return Err(::std::convert::From::from(err)),
    });
}
```

简单看一下与 `?` 的对比:

```rust
//  `?`
let x = function_with_error()?; // 若返回 Err, 则立刻返回；若返回 Ok(255)，则将 x 的值设置为 255

// `try!()`
let x = try!(function_with_error());
```

可以看出 `?` 的优势非常明显，何况 `?` 还能做链式调用。

总之，`try!` 作为前浪已经死在了沙滩上，**在当前版本中，我们要尽量避免使用 try!**。

## 5.5 课后练习

> [Rust By Practice](https://zh.practice.rs/result-panic/result.html)，支持代码在线编辑和运行，并提供详细的[习题解答](https://github.com/sunface/rust-by-practice)。

