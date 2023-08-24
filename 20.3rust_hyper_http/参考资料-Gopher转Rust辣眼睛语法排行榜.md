# Gopher转Rust辣眼睛语法排行榜

作者：中弈 - sealos作者，sealer发起人

## TOP 10 经常忘记写的分号

```text
fn add_with_extra(x: i32, y: i32) -> i32 {
    let x = x + 1; // 语句
    let y = y + 5; // 语句
    x + y // 表达式
}
```

当你是从golang刚转过来，你一定经常忘记写分号, 对于 Rust 语言而言，这种基于语句和表达式的方式是非常重要，而且很多时候有了表达式会很方便， 比如不用再写return,或者在匹配的时候使用。

语句执行一些操作无返回值，表达式会求值后返回一个值，所以分号‘;’就很重要了。

## TOP 9 感叹号

```text
fn main() {
   println!("hello world"); 
}
```

这是什么鬼，为什么println后面要加个感叹号，是叫我别打印嘛？其实这是go里面没有的宏，宏可以干很多函数无能为力的事，在很多情况下也非常方便。 比如元编程，可变参数，为指定的类型实现某个特征等，而且编译之前就做好了展开。其本质是生成(替换)一些代码，让我们少写代码。

## TOP 8 &str String::from("傻傻分布清楚")

怎么整个字符串这么麻烦。。。

```text
let s = "hello";
```

s是被硬编码进程序的，大小固定在栈区内存分配，类型为&str.

```text
let mut s = String::from("hello");
s.push_str(",world!");
```

s大小不可知道，分配在堆上，类型为String.

## TOP 7 引用借用

常规的引用是一个指针类型，指向了对象存储的内存地址。 借用：获取变量的引用。

```text
let x = 5;
let y = &x;
```

这里y就是x的引用。引用的时候变量的所有权(一夫一妻)不会发生转移，引用=(出轨)。

```text
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

![img](https://pic1.zhimg.com/80/v2-ebf35152a8d62e8a1f67f595a5751eb0_720w.jpg)

## TOP 6 Attribute

```text
#[allow(dead_code)]
fn unused_function() {}
```

这眼睛真是辣了，怎么还来个脚本语言的注释？细细一看，哦，这叫Attribute，能干很多事，如：

- 条件编译代码
- 设置 crate 名称、版本和类型（二进制文件或库）

- 禁用 lint （警告）
- 启用编译器的特性（宏、全局导入（glob import）等）

- 链接到一个非 Rust 语言的库
- 标记函数作为单元测试

- 标记函数作为基准测试的某个部分

等...

习惯之后发现，确实简单很多，还能少写好的代码。比如：

```text
#[derive(Debug)] // 加了就可以打印结构体debug信息了,不用自己去实现Display
struct Point {
    x: i32,
    y: i32,
}

println!("{:?}", p);
```

## TOP 5 Option Result枚举

```text
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

let five = Some(5);
let six = plus_one(five);
let none = plus_one(None);
```

刚开始写的新手一定觉得自己是个垃圾，怎么去取一个返回值都玩不明白，干嘛整这么复杂。 其实这是个非常安全的设计，Tony Hoare， null 的发明者，曾经说过 我称之为我十亿美元的错误。当时，我在使用一个面向对象语言设计第一个综合性的面向引用的类型系统。我的目标是通过编译器的自动检查来保证所有引用的使用都应该是绝对安全的。不过在设计过程中，我未能抵抗住诱惑，引入了空引用的概念，因为它非常容易实现。就是因为这个决策，引发了无数错误、漏洞和系统崩溃，在之后的四十多年中造成了数十亿美元的苦痛和伤害。

我们写golang也经常因为访问了nil对象引发错误，而rust中抛弃了这一做法。自动走到空值的分支，习惯之后是非常安全和优雅的。

```text
let age = Some(30);
if let Some(age) = age { // if let就不会取出空值，非常舒服
    println!("age{}",age);
}
```

## TOP 4 变量绑定@

```text
enum Message {
    Hello { id: i32 },
}

let msg = Message::Hello { id: 5 };

match msg {
    Message::Hello { id: id_variable @ 3..=7 } => {
        println!("Found an id in range: {}", id_variable)
    },
}
```

`id_variable @ 3..=7` gopher: 这是在写代码还是在发朋友圈？@运算符允许为一个字段绑定另外一个变量，这样就能在下面的代码中使用该变量了.

## TOP 3 self Self super自我？本我？超我？这是编程语言还是搞哲学

self大部分人分分钟理解，可是又冒出个Self，其它语言过来的瞬间就慌了。。。

其实也很简单，Self表示结构体本身，self代表对象本身：

```text
pub struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    pub fn new(width: u32, height: u32) -> Self {
        Rectangle { width, height }
    }
    pub fn width(&self) -> u32 {
        return self.width;
    }
}

fn main() {
    let rect1 = Rectangle::new(30, 50);

    println!("{}", rect1.width());
}
```

所以这里 `Self = Rectangle`

super只是为了配合`超我`，就是访问父模块，和上面没啥太大关系

```text
mod a {
    pub fn foo() {}
}
mod b {
    pub fn foo() {
        super::a::foo(); // 父模块
    }
}
```

## TOP 2 泛型

```text
fn bench_heap_sizes<I, H, B>(c: &mut Criterion, name: &str, init: I, new_test_heap: H)
where
    I: Fn(Key, &[u32]),
    H: Fn(Key, Vec<u32>) -> NewHeap,
    B: Benchmark,
{
```

gopher们是不是被上面代码辣出了白内障？但是接触过c++的可能都还能接受，I,H,B其实就是代表一个类型，where里面注明你不是啥类型都可以， 必须满足一定特征。

泛型确实在很多时候带来了很多方便，少写了很多代码，编译器会根据泛型为我们生成很多代码，Rust在泛型性能这块也做了很多优化，在运行时就知道具体类型了，不需要动态分发，这点比渣渣c++好太多(我黑c++不怕被骂)

go里面觉得接口可以搞定这种需求，没引入泛型，也挺简单的，有它的编程哲学。

## TOP 1 生命周期声明

任何gopher第一眼看到这个单引号的时候眼睛一定是被辣瞎的，然后一万只草泥马。。。

```text
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

x、y 和返回值至少活得和 'a 一样久(因为返回值要么是 x，要么是 y)，如果你不申明，对不起编译器让你哭。。。 所以新手在写的时候有种和编译器有仇的感觉，然后编译器像你妈一样告诉你：“我这都是为你好！”

你以为这就结束了？还有静态生命周期。。。

```text
let s: &'static str = "逼死强迫症";
```

# 极度舒适TOP 3

写了这么多辣眼睛语法(其实似黑实夸)，担心被rust粉揍，来补充几条我觉得极度舒适的点：

## TOP 3 枚举与匹配

Rust的枚举和匹配非常强，应用非常广泛，你可能会说咱也有switch case啊，然后在rust的enum 和match面前就是个弟弟.

```text
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

枚举里面可以支持不同的类型，元组结构体等，这很有用，比如在开发一个通信模块，接收的数据类型会有好几个种类，就可以非常方便优雅的解决问题，举个例子： 在sealos用rust写的前端中就有类似代码：

```text
#[derive(Switch,Clone)]
pub enum AppRoute {
    #[to = "/images/{name}"]
    ImageDetail(String),
    #[to = "/images"]
    Images
}
```

路由匹配，有的路由带参数，有的不带，就可以通过枚举实现。

## TOP 2 包管理

cargo的包管理是很舒服的，gopher们应该经常遇到编码十分钟，依赖解决一整天的情况，这在rust里面，不存在的。 而且go的包管理方式变来变去好多次， 该用啥工具，该不该vendor等等，不过随着golang版本的升级这块比早期改善很多了。

## TOP 1 错误处理

写go的估计都被if err != nil折磨疯了，三分之二代码是 if err != nil, 下面来感受一下没有对比就没有伤害:

Golang:

```text
func read_username_from_file() (string, error) {
   f,err := os.OpenFile("hello.txt",os.O_CREATE|os.O_RDWR|os.O_APPEND, os.ModeAppend|os.ModePerm)
   if err != nil {
      return "", error
   }
   defer file.Close()
   content, err := ioutil.ReadAll(file)
   if err != nil {
      return "",error
   }
   return string(content),nil
}
```

这里我们把错误返回让上层处理，两次if err != nil, 来看看Rust:

```text
fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;
    Ok(s)
}
```

`?` 可以透明传输错误，而且可以链多调用，这样代码就会简洁很多。Rust错误处理还不止这些，以上最具有代表性，希望go v2也能让错误处理更方便一些。

# 总结

以上不权威排名有非常强烈的个人色彩，大家不必太认真，主要目的想圈出一些go转rust同学需要主意的点，两门语言都非常优秀，黑哪一个是不存在的，gopher和 Rust粉都轻喷~

编程语言都有各自的优势，以下说一下我自己学习Rust的一点心得：

1. 说Rust学习曲线陡，这其实非常不利于推广，其实并没有多难，特别对于c/c++基础的人来说，绝对不是事儿，心里上不要有任何压力。
2. 确实和我学go python会有点不一样，go python基本是瞄一眼直接上手写项目了，Rust我觉得还是有必要系统性学习一下。

1. 动手！动手！动手！说三遍，书中例子你看懂了，再简单你不一定能自己写出来，能写出来也不一定能编译过去，所以动手非常重要。
2. 总结，把一些难点东西总结出来，写博客什么的，这个过程会让你重新思考，理解更深入。

# 资料

本文引用大量 [rust语言圣经](https://link.zhihu.com/?target=https%3A//course.rs/) 代码和介绍，非常好的学习材料，想系统学习rust的同学可参考 [kubernetes一键安装](https://link.zhihu.com/?target=https%3A//sealyun.com/)