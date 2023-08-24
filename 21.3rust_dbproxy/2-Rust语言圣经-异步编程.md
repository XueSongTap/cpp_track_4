版权归rust语言圣经原作者所有，如有侵权请联系删除。

# Rust 异步编程

在艰难的学完 Rust 入门和进阶所有的 70 个章节后，我们终于来到了这里。假如之前攀登的是珠穆朗玛峰，那么现在攀登的就是乔戈里峰( 比珠峰还难攀爬... )。

如果你想开发 Web 服务器、数据库驱动、消息服务等需要高并发的服务，那么本章的内容将值得认真对待和学习，将从以下方面深入讲解 Rust 的异步编程：

- Rust 异步编程的通用概念介绍
- Future 以及异步任务调度
- async/await 和 Pin/Unpin
- 异步编程常用的三方库
- tokio 库
- 一些示例

# **异步编程**



接下来，我们将深入了解 async/await 的使用方式及背后的原理。



\> 本章在内容上大量借鉴和翻译了原版英文书籍[Asynchronous Programming In Rust](https://rust-lang.github.io/async-book/01_getting_started/01_chapter.html), 特此感谢

# Async 编程简介

众所周知，Rust 可以让我们写出性能高且安全的软件，那么异步编程这块儿呢？是否依然在高性能的同时保证了安全？

我们先通过一张 web 框架性能对比图来感受下 Rust 异步编程的性能:

<img alt="actix-vs-gin screenshot" width="100%" src="https://pic1.zhimg.com/v2-3cebd732fb56f43713f106fdcfa44a3c_b.png" class="center"  />

上图并不能说 Rust 写的 `actix` 框架比 Go 的 `gin` 更好、更优秀，但是确实可以一定程度上说明 **Rust 的异步性能非常的高**！

简单来说，异步编程是一个[并发编程模型](https://course.rs/advance/concurrency-with-threads/concurrency-parallelism.html)，目前主流语言基本都支持了，当然，支持的方式有所不同。异步编程允许我们同时并发运行大量的任务，却仅仅需要几个甚至一个 OS 线程或 CPU 核心，现代化的异步编程在使用体验上跟同步编程也几无区别，例如 Go 语言的 `go` 关键字，也包括我们后面将介绍的 `async/await` 语法，该语法是 `JavaScript` 和 `Rust` 的核心特性之一。

## async 简介

`async` 是 Rust 选择的异步编程模型，下面我们来介绍下它的优缺点，以及何时适合使用。

#### async vs 其它并发模型

由于并发编程在现代社会非常重要，因此每个主流语言都对自己的并发模型进行过权衡取舍和精心设计，Rust 语言也不例外。下面的列表可以帮助大家理解不同并发模型的取舍:

- **OS 线程**, 它最简单，也无需改变任何编程模型(业务/代码逻辑)，因此非常适合作为语言的原生并发模型，我们在[多线程章节](https://course.rs/advance/concurrency-with-threads/concurrency-parallelism.html)也提到过，Rust 就选择了原生支持线程级的并发编程。但是，这种模型也有缺点，例如线程间的同步将变得更加困难，线程间的上下文切换损耗较大。使用线程池在一定程度上可以提升性能，但是对于 IO 密集的场景来说，线程池还是不够。
- **事件驱动(Event driven)**, 这个名词你可能比较陌生，如果说事件驱动常常跟回调( Callback )一起使用，相信大家就恍然大悟了。这种模型性能相当的好，但最大的问题就是存在回调地狱的风险：非线性的控制流和结果处理导致了数据流向和错误传播变得难以掌控，还会导致代码可维护性和可读性的大幅降低，大名鼎鼎的 `JavaScript` 曾经就存在回调地狱。
- **协程(Coroutines)** 可能是目前最火的并发模型，`Go` 语言的协程设计就非常优秀，这也是 `Go` 语言能够迅速火遍全球的杀手锏之一。协程跟线程类似，无需改变编程模型，同时，它也跟 `async` 类似，可以支持大量的任务并发运行。但协程抽象层次过高，导致用户无法接触到底层的细节，这对于系统编程语言和自定义异步运行时是难以接受的
- **actor 模型**是 erlang 的杀手锏之一，它将所有并发计算分割成一个一个单元，这些单元被称为 `actor` , 单元之间通过消息传递的方式进行通信和数据传递，跟分布式系统的设计理念非常相像。由于 `actor` 模型跟现实很贴近，因此它相对来说更容易实现，但是一旦遇到流控制、失败重试等场景时，就会变得不太好用
- **async/await**， 该模型性能高，还能支持底层编程，同时又像线程和协程那样无需过多的改变编程模型，但有得必有失，`async` 模型的问题就是内部实现机制过于复杂，对于用户来说，理解和使用起来也没有线程和协程简单，好在前者的复杂性开发者们已经帮我们封装好，而理解和使用起来不够简单，正是本章试图解决的问题。

总之，Rust 经过权衡取舍后，最终选择了同时提供多线程编程和 async 编程:

- 前者通过标准库实现，当你无需那么高的并发时，例如需要并行计算时，可以选择它，优点是线程内的代码执行效率更高、实现更直观更简单，这块内容已经在多线程章节进行过深入讲解，不再赘述
- 后者通过语言特性 + 标准库 + 三方库的方式实现，在你需要高并发、异步 `I/O` 时，选择它就对了

#### async: Rust vs 其它语言

目前已经有诸多语言都通过 `async` 的方式提供了异步编程，例如 `JavaScript` ，但 `Rust` 在实现上有所区别:

- **Future 在 Rust 中是惰性的**，只有在被轮询(`poll`)时才会运行， 因此丢弃一个 `future` 会阻止它未来再被运行, 你可以将`Future`理解为一个在未来某个时间点被调度执行的任务。
- **Async 在 Rust 中使用开销是零**， 意味着只有你能看到的代码(自己的代码)才有性能损耗，你看不到的(`async` 内部实现)都没有性能损耗，例如，你可以无需分配任何堆内存、也无需任何动态分发来使用 `async` ，这对于热点路径的性能有非常大的好处，正是得益于此，Rust 的异步编程性能才会这么高。
- **Rust 没有内置异步调用所必须的运行时**，但是无需担心，Rust 社区生态中已经提供了非常优异的运行时实现，例如大明星 [`tokio`](https://tokio.rs)
- **运行时同时支持单线程和多线程**，这两者拥有各自的优缺点，稍后会讲

#### Rust: async vs 多线程

虽然 `async` 和多线程都可以实现并发编程，后者甚至还能通过线程池来增强并发能力，但是这两个方式并不互通，从一个方式切换成另一个需要大量的代码重构工作，因此提前为自己的项目选择适合的并发模型就变得至关重要。

`OS` 线程非常适合少量任务并发，因为线程的创建和上下文切换是非常昂贵的，甚至于空闲的线程都会消耗系统资源。虽说线程池可以有效的降低性能损耗，但是也无法彻底解决问题。当然，线程模型也有其优点，例如它不会破坏你的代码逻辑和编程模型，你之前的顺序代码，经过少量修改适配后依然可以在新线程中直接运行，同时在某些操作系统中，你还可以改变线程的优先级，这对于实现驱动程序或延迟敏感的应用(例如硬实时系统)很有帮助。

对于长时间运行的 CPU 密集型任务，例如并行计算，使用线程将更有优势。 这种密集任务往往会让所在的线程持续运行，任何不必要的线程切换都会带来性能损耗，因此高并发反而在此时成为了一种多余。同时你所创建的线程数应该等于 CPU 核心数，充分利用 CPU 的并行能力，甚至还可以将线程绑定到 CPU 核心上，进一步减少线程上下文切换。

而高并发更适合 `IO` 密集型任务，例如 web 服务器、数据库连接等等网络服务，因为这些任务绝大部分时间都处于等待状态，如果使用多线程，那线程大量时间会处于无所事事的状态，再加上线程上下文切换的高昂代价，让多线程做 `IO` 密集任务变成了一件非常奢侈的事。而使用`async`，既可以有效的降低 `CPU` 和内存的负担，又可以让大量的任务并发的运行，一个任务一旦处于`IO`或者其他等待(阻塞)状态，就会被立刻切走并执行另一个任务，而这里的任务切换的性能开销要远远低于使用多线程时的线程上下文切换。

事实上, `async` 底层也是基于线程实现，但是它基于线程封装了一个运行时，可以将多个任务映射到少量线程上，然后将线程切换变成了任务切换，后者仅仅是内存中的访问，因此要高效的多。

不过`async`也有其缺点，原因是编译器会为`async`函数生成状态机，然后将整个运行时打包进来，这会造成我们编译出的二进制可执行文件体积显著增大。

总之，`async`编程并没有比多线程更好，最终还是根据你的使用场景作出合适的选择，如果无需高并发，或者也不在意线程切换带来的性能损耗，那么多线程使用起来会简单、方便的多！最后再简单总结下：

> 若大家使用 tokio，那 CPU 密集的任务尤其需要用线程的方式去处理，例如使用 `spawn_blocking` 创建一个阻塞的线程取完成相应 CPU 密集任务。
>
> 至于具体的原因，不仅是上文说到的那些，还有一个是：tokio 是协作式地调度器，如果某个 CPU 密集的异步任务是通过 tokio 创建的，那理论上来说，该异步任务需要跟其它的异步任务交错执行，最终大家都得到了执行，皆大欢喜。但实际情况是，CPU 密集的任务很可能会一直霸着着 CPU，此时 tokio 的调度方式决定了该任务会一直被执行，这意味着，其它的异步任务无法得到执行的机会，最终这些任务都会因为得不到资源而饿死。
>
> 而使用 `spawn_blocking` 后，会创建一个单独的 OS 线程，该线程并不会被 tokio 所调度( 被 OS 所调度 )，因此它所执行的 CPU 密集任务也不会导致 tokio 调度的那些异步任务被饿死


- 有大量 `IO` 任务需要并发运行时，选 `async` 模型
- 有部分 `IO` 任务需要并发运行时，选多线程，如果想要降低线程创建和销毁的开销，可以使用线程池
- 有大量 `CPU` 密集任务需要并行运行时，例如并行计算，选多线程模型，且让线程数等于或者稍大于 `CPU` 核心数
- 无所谓时，统一选多线程

#### async 和多线程的性能对比

| 操作     | async    | 线程     |
| -------- | -------- | -------- |
| 创建     | 0.3 微秒 | 17 微秒  |
| 线程切换 | 0.2 微秒 | 1.7 微秒 |

可以看出，`async` 在线程切换的开销显著低于多线程，对于 IO 密集的场景，这种性能开销累计下来会非常可怕！

#### 一个例子

在大概理解`async`后，我们再来看一个简单的例子。如果想并发的下载文件，你可以使用多线程如下实现:

```rust
fn get_two_sites() {
    // 创建两个新线程执行任务
    let thread_one = thread::spawn(|| download("https://course.rs"));
    let thread_two = thread::spawn(|| download("https://fancy.rs"));

    // 等待两个线程的完成
    thread_one.join().expect("thread one panicked");
    thread_two.join().expect("thread two panicked");
}
```

如果是在一个小项目中简单的去下载文件，这么写没有任何问题，但是一旦下载文件的并发请求多起来，那一个下载任务占用一个线程的模式就太重了，会很容易成为程序的瓶颈。好在，我们可以使用`async`的方式来解决：

```rust
async fn get_two_sites_async() {
    // 创建两个不同的`future`，你可以把`future`理解为未来某个时刻会被执行的计划任务
    // 当两个`future`被同时执行后，它们将并发的去下载目标页面
    let future_one = download_async("https://www.foo.com");
    let future_two = download_async("https://www.bar.com");

    // 同时运行两个`future`，直至完成
    join!(future_one, future_two);
}
```

此时，不再有线程创建和切换的昂贵开销，所有的函数都是通过静态的方式进行分发，同时也没有任何内存分配发生。这段代码的性能简直无懈可击！

事实上，`async` 和多线程并不是二选一，在同一应用中，可以根据情况两者一起使用，当然，我们还可以使用其它的并发模型，例如上面提到事件驱动模型，前提是有三方库提供了相应的实现。

## Async Rust 当前的进展

简而言之，Rust 语言的 `async` 目前还没有达到多线程的成熟度，其中一部分内容还在不断进化中，当然，这并不影响我们在生产级项目中使用，因为社区中还有 `tokio` 这种大杀器。

使用 `async` 时，你会遇到好的，也会遇到不好的，例如：

- 收获卓越的性能
- 会经常跟进阶语言特性打交道，例如生命周期等，这些家伙可不好对付
- 一些兼容性问题，例如同步和异步代码、不同的异步运行时( `tokio` 与 `async-std` )
- 更昂贵的维护成本，原因是 `async` 和社区开发的运行时依然在不停的进化

总之，`async` 在 Rust 中并不是一个善茬，你会遇到更多的困难或者说坑，也会带来更高的代码阅读成本及维护成本，但是为了性能，一切都值了，不是吗？

不过好在，这些进化早晚会彻底稳定成熟，而且在实际项目中，我们往往会使用成熟的三方库，例如`tokio`，因此可以避免一些类似的问题，但是对于本章的学习来说，`async` 的一些难点还是我们必须要去面对和征服的。

#### 语言和库的支持

`async` 的底层实现非常复杂，且会导致编译后文件体积显著增加，因此 Rust 没有选择像 Go 语言那样内置了完整的特性和运行时，而是选择了通过 Rust 语言提供了必要的特性支持，再通过社区来提供 `async` 运行时的支持。 因此要完整的使用 `async` 异步编程，你需要依赖以下特性和外部库:

- 所必须的特征(例如 `Future` )、类型和函数，由标准库提供实现
- 关键字 `async/await` 由 Rust 语言提供，并进行了编译器层面的支持
- 众多实用的类型、宏和函数由官方开发的 [`futures`](https://github.com/rust-lang/futures-rs) 包提供(不是标准库)，它们可以用于任何 `async` 应用中。
- `async` 代码的执行、`IO` 操作、任务创建和调度等等复杂功能由社区的 `async` 运行时提供，例如 [`tokio`](https://github.com/tokio-rs/tokio) 和 [`async-std`](https://github.com/async-rs/async-std)

还有，你在同步( `synchronous` )代码中使用的一些语言特性在 `async` 中可能将无法再使用，而且 Rust 也不允许你在特征中声明 `async` 函数(可以通过三方库实现)， 总之，你会遇到一些在同步代码中不会遇到的奇奇怪怪、形形色色的问题，不过不用担心，本章会专门用一个章节罗列这些问题，并给出相应的解决方案。

#### 编译和错误

在大多数情况下，`async` 中的编译错误和运行时错误跟之前没啥区别，但是依然有以下几点值得注意：

- 编译错误，由于 `async` 编程时需要经常使用复杂的语言特性，例如生命周期和`Pin`，因此相关的错误可能会出现的更加频繁
- 运行时错误，编译器会为每一个`async`函数生成状态机，这会导致在栈跟踪时会包含这些状态机的细节，同时还包含了运行时对函数的调用，因此，栈跟踪记录(例如 `panic` 时)将变得更加难以解读
- 一些隐蔽的错误也可能发生，例如在一个 `async` 上下文中去调用一个阻塞的函数，或者没有正确的实现 `Future` 特征都有可能导致这种错误。这种错误可能会悄无声息的通过编译检查甚至有时候会通过单元测试。好在一旦你深入学习并掌握了本章的内容和 `async` 原理，可以有效的降低遇到这些错误的概率

#### 兼容性考虑

异步代码和同步代码并不总能和睦共处。例如，我们无法在一个同步函数中去调用一个 `async` 异步函数，同步和异步代码也往往使用不同的设计模式，这些都会导致两者融合上的困难。

甚至于有时候，异步代码之间也存在类似的问题，如果一个库依赖于特定的 `async` 运行时来运行，那么这个库非常有必要告诉它的用户，它用了这个运行时。否则一旦用户选了不同的或不兼容的运行时，就会导致不可预知的麻烦。

#### 性能特性

`async` 代码的性能主要取决于你使用的 `async` 运行时，好在这些运行时都经过了精心的设计，在你能遇到的绝大多数场景中，它们都能拥有非常棒的性能表现。

但是世事皆有例外。目前主流的 `async` 运行时几乎都使用了多线程实现，相比单线程虽然增加了并发表现，但是对于执行性能会有所损失，因为多线程实现会有同步和切换上的性能开销，若你需要极致的顺序执行性能，那么 `async` 目前并不是一个好的选择。

同样的，对于延迟敏感的任务来说，任务的执行次序需要能被严格掌控，而不是交由运行时去自动调度，后者会导致不可预知的延迟，例如一个 web 服务器总是有 `1%` 的请求，它们的延迟会远高于其它请求，因为调度过于繁忙导致了部分任务被延迟调度，最终导致了较高的延时。正因为此，这些延迟敏感的任务非常依赖于运行时或操作系统提供调度次序上的支持。

以上的两个需求，目前的 `async` 运行时并不能很好的支持，在未来可能会有更好的支持，但在此之前，我们可以尝试用多线程解决。

## async/.await 简单入门

`async/.await` 是 Rust 内置的语言特性，可以让我们用同步的方式去编写异步的代码。

通过 `async` 标记的语法块会被转换成实现了`Future`特征的状态机。 与同步调用阻塞当前线程不同，当`Future`执行并遇到阻塞时，它会让出当前线程的控制权，这样其它的`Future`就可以在该线程中运行，这种方式完全不会导致当前线程的阻塞。

下面我们来通过例子学习 `async/.await` 关键字该如何使用，在开始之前，需要先引入 `futures` 包。编辑 `Cargo.toml` 文件并添加以下内容:

```toml
[dependencies]
futures = "0.3"
```

#### 使用 async

首先，使用 `async fn` 语法来创建一个异步函数:

```rust
async fn do_something() {
    println!("go go go !");
}
```

需要注意，**异步函数的返回值是一个 `Future`**，若直接调用该函数，不会输出任何结果，因为 `Future` 还未被执行：

```rust
fn main() {
      do_something();
}
```

运行后，`go go go`并没有打印，同时编译器给予一个提示：`warning: unused implementer of Future that must be used`，告诉我们 `Future` 未被使用，那么到底该如何使用？答案是使用一个执行器( `executor` ):

```rust
// `block_on`会阻塞当前线程直到指定的`Future`执行完成，这种阻塞当前线程以等待任务完成的方式较为简单、粗暴，
// 好在其它运行时的执行器(executor)会提供更加复杂的行为，例如将多个`future`调度到同一个线程上执行。
use futures::executor::block_on;

async fn hello_world() {
    println!("hello, world!");
}

fn main() {
    let future = hello_world(); // 返回一个Future, 因此不会打印任何输出
    block_on(future); // 执行`Future`并等待其运行完成，此时"hello, world!"会被打印输出
}
```

#### 使用.await

在上述代码的`main`函数中，我们使用`block_on`这个执行器等待`Future`的完成，让代码看上去非常像是同步代码，但是如果你要在一个`async fn`函数中去调用另一个`async fn`并等待其完成后再执行后续的代码，该如何做？例如:

```rust
use futures::executor::block_on;

async fn hello_world() {
    hello_cat();
    println!("hello, world!");
}

async fn hello_cat() {
    println!("hello, kitty!");
}
fn main() {
    let future = hello_world();
    block_on(future);
}
```

这里，我们在`hello_world`异步函数中先调用了另一个异步函数`hello_cat`，然后再输出`hello, world!`，看看运行结果：

```console
warning: unused implementer of `futures::Future` that must be used
 --> src/main.rs:6:5
  |
6 |     hello_cat();
  |     ^^^^^^^^^^^^
= note: futures do nothing unless you `.await` or poll them
...
hello, world!
```

不出所料，`main`函数中的`future`我们通过`block_on`函数进行了运行，但是这里的`hello_cat`返回的`Future`却没有任何人去执行它，不过好在编译器友善的给出了提示：```futures do nothing unless you `.await` or poll them```，两种解决方法：使用`.await`语法或者对`Future`进行轮询(`poll`)。

后者较为复杂，暂且不表，先来使用`.await`试试:

```rust
use futures::executor::block_on;

async fn hello_world() {
    hello_cat().await;
    println!("hello, world!");
}

async fn hello_cat() {
    println!("hello, kitty!");
}
fn main() {
    let future = hello_world();
    block_on(future);
}
```

为`hello_cat()`添加上`.await`后，结果立刻大为不同:

```console
hello, kitty!
hello, world!
```

输出的顺序跟代码定义的顺序完全符合，因此，我们在上面代码中**使用同步的代码顺序实现了异步的执行效果**，非常简单、高效，而且很好理解，未来也绝对不会有回调地狱的发生。

总之，在`async fn`函数中使用`.await`可以等待另一个异步调用的完成。**但是与`block_on`不同，`.await`并不会阻塞当前的线程**，而是异步的等待`Future A`的完成，在等待的过程中，该线程还可以继续执行其它的`Future B`，最终实现了并发处理的效果。

#### 一个例子

考虑一个载歌载舞的例子，如果不用`.await`，我们可能会有如下实现：

```rust
use futures::executor::block_on;

struct Song {
    author: String,
    name: String,
}

async fn learn_song() -> Song {
    Song {
        author: "曲婉婷".to_string(),
        name: String::from("《我的歌声里》"),
    }
}

async fn sing_song(song: Song) {
    println!(
        "给大家献上一首{}的{} ~ {}",
        song.author, song.name, "你存在我深深的脑海里~ ~"
    );
}

async fn dance() {
    println!("唱到情深处，身体不由自主的动了起来~ ~");
}

fn main() {
    let song = block_on(learn_song());
    block_on(sing_song(song));
    block_on(dance());
}
```

当然，以上代码运行结果无疑是正确的，但。。。它的性能何在？需要通过连续三次阻塞去等待三个任务的完成，一次只能做一件事，实际上我们完全可以载歌载舞啊:

```rust
use futures::executor::block_on;

struct Song {
    author: String,
    name: String,
}

async fn learn_song() -> Song {
    Song {
        author: "曲婉婷".to_string(),
        name: String::from("《我的歌声里》"),
    }
}

async fn sing_song(song: Song) {
    println!(
        "给大家献上一首{}的{} ~ {}",
        song.author, song.name, "你存在我深深的脑海里~ ~"
    );
}

async fn dance() {
    println!("唱到情深处，身体不由自主的动了起来~ ~");
}

async fn learn_and_sing() {
    // 这里使用`.await`来等待学歌的完成，但是并不会阻塞当前线程，该线程在学歌的任务`.await`后，完全可以去执行跳舞的任务
    let song = learn_song().await;

    // 唱歌必须要在学歌之后
    sing_song(song).await;
}

async fn async_main() {
    let f1 = learn_and_sing();
    let f2 = dance();

    // `join!`可以并发的处理和等待多个`Future`，若`learn_and_sing Future`被阻塞，那`dance Future`可以拿过线程的所有权继续执行。若`dance`也变成阻塞状态，那`learn_and_sing`又可以再次拿回线程所有权，继续执行。
    // 若两个都被阻塞，那么`async main`会变成阻塞状态，然后让出线程所有权，并将其交给`main`函数中的`block_on`执行器
    futures::join!(f1, f2);
}

fn main() {
    block_on(async_main());
}
```

上面代码中，学歌和唱歌具有明显的先后顺序，但是这两者都可以跟跳舞一同存在，也就是你可以在跳舞的时候学歌，也可以在跳舞的时候唱歌。如果上面代码不使用`.await`，而是使用`block_on(learn_song())`， 那在学歌时，当前线程就会阻塞，不再可以做其它任何事，包括跳舞。

因此`.await`对于实现异步编程至关重要，它允许我们在同一个线程内并发的运行多个任务，而不是一个一个先后完成。若大家看到这里还是不太明白，强烈建议回头再仔细看一遍，同时亲自上手修改代码试试效果。

至此，读者应该对 Rust 的`async/.await`异步编程有了一个清晰的初步印象，下面让我们一起来看看这背后的原理：`Future`和任务在底层如何被执行。



# 底层探秘: Future 执行器与任务调度

异步编程背后到底藏有什么秘密？究竟是哪只幕后之手在操纵这一切？如果你对这些感兴趣，就继续看下去，否则可以直接跳过，因为本章节的内容对于一个 API 工程师并没有太多帮助。

但是如果你希望能深入理解 `Rust` 的 `async/.await` 代码是如何工作、理解运行时和性能，甚至未来想要构建自己的 `async` 运行时或相关工具，那么本章节终究不会辜负于你。

## Future 特征

`Future` 特征是 Rust 异步编程的核心，毕竟异步函数是异步编程的核心，而 `Future` 恰恰是异步函数的返回值和被执行的关键。

首先，来给出 `Future` 的定义：它是一个能产出值的异步计算(虽然该值可能为空，例如 `()` )。光看这个定义，可能会觉得很空洞，我们来看看一个简化版的 `Future` 特征:

```rust
trait SimpleFuture {
    type Output;
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output>;
}

enum Poll<T> {
    Ready(T),
    Pending,
}
```

在上一章中，我们提到过 `Future` 需要被执行器`poll`(轮询)后才能运行，诺，这里 `poll` 就来了，通过调用该方法，可以推进 `Future` 的进一步执行，直到被切走为止( 这里不好理解，但是你只需要知道 `Future` 并不能保证在一次 `poll` 中就被执行完，后面会详解介绍)。

若在当前 `poll` 中， `Future` 可以被完成，则会返回 `Poll::Ready(result)` ，反之则返回 `Poll::Pending`， 并且安排一个 `wake` 函数：当未来 `Future` 准备好进一步执行时， 该函数会被调用，然后管理该 `Future` 的执行器(例如上一章节中的`block_on`函数)会再次调用 `poll` 方法，此时 `Future` 就可以继续执行了。

如果没有 `wake `方法，那执行器无法知道某个`Future`是否可以继续被执行，除非执行器定期的轮询每一个 `Future` ，确认它是否能被执行，但这种作法效率较低。而有了 `wake`，`Future` 就可以主动通知执行器，然后执行器就可以精确的执行该 `Future`。 这种“事件通知 -> 执行”的方式要远比定期对所有 `Future` 进行一次全遍历来的高效。

也许大家还是迷迷糊糊的，没事，我们用一个例子来说明下。考虑一个需要从 `socket` 读取数据的场景：如果有数据，可以直接读取数据并返回 `Poll::Ready(data)`， 但如果没有数据，`Future` 会被阻塞且不会再继续执行，此时它会注册一个 `wake` 函数，当 `socket` 数据准备好时，该函数将被调用以通知执行器：我们的 `Future` 已经准备好了，可以继续执行。

下面的 `SocketRead` 结构体就是一个 `Future`:

```rust
pub struct SocketRead<'a> {
    socket: &'a Socket,
}

impl SimpleFuture for SocketRead<'_> {
    type Output = Vec<u8>;

    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        if self.socket.has_data_to_read() {
            // socket有数据，写入buffer中并返回
            Poll::Ready(self.socket.read_buf())
        } else {
            // socket中还没数据
            //
            // 注册一个`wake`函数，当数据可用时，该函数会被调用，
            // 然后当前Future的执行器会再次调用`poll`方法，此时就可以读取到数据
            self.socket.set_readable_callback(wake);
            Poll::Pending
        }
    }
}
```

这种 `Future` 模型允许将多个异步操作组合在一起，同时还无需任何内存分配。不仅仅如此，如果你需要同时运行多个 `Future`或链式调用多个 `Future` ，也可以通过无内存分配的状态机实现，例如：

```rust
trait SimpleFuture {
    type Output;
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output>;
}

enum Poll<T> {
    Ready(T),
    Pending,
}

/// 一个SimpleFuture，它会并发地运行两个Future直到它们完成
///
/// 之所以可以并发，是因为两个Future的轮询可以交替进行，一个阻塞，另一个就可以立刻执行，反之亦然
pub struct Join<FutureA, FutureB> {
    // 结构体的每个字段都包含一个Future，可以运行直到完成.
    // 如果Future完成后，字段会被设置为 `None`. 这样Future完成后，就不会再被轮询
    a: Option<FutureA>,
    b: Option<FutureB>,
}

impl<FutureA, FutureB> SimpleFuture for Join<FutureA, FutureB>
where
    FutureA: SimpleFuture<Output = ()>,
    FutureB: SimpleFuture<Output = ()>,
{
    type Output = ();
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        // 尝试去完成一个 Future `a`
        if let Some(a) = &mut self.a {
            if let Poll::Ready(()) = a.poll(wake) {
                self.a.take();
            }
        }

        // 尝试去完成一个 Future `b`
        if let Some(b) = &mut self.b {
            if let Poll::Ready(()) = b.poll(wake) {
                self.b.take();
            }
        }

        if self.a.is_none() && self.b.is_none() {
            // 两个 Future都已完成 - 我们可以成功地返回了
            Poll::Ready(())
        } else {
            // 至少还有一个 Future 没有完成任务，因此返回 `Poll::Pending`.
            // 当该 Future 再次准备好时，通过调用`wake()`函数来继续执行
            Poll::Pending
        }
    }
}
```

上面代码展示了如何同时运行多个 `Future`， 且在此过程中没有任何内存分配，让并发编程更加高效。 类似的，多个`Future`也可以一个接一个的连续运行：

```rust
/// 一个SimpleFuture, 它使用顺序的方式，一个接一个地运行两个Future
//
// 注意: 由于本例子用于演示，因此功能简单，`AndThenFut` 会假设两个 Future 在创建时就可用了.
// 而真实的`Andthen`允许根据第一个`Future`的输出来创建第二个`Future`，因此复杂的多。
pub struct AndThenFut<FutureA, FutureB> {
    first: Option<FutureA>,
    second: FutureB,
}

impl<FutureA, FutureB> SimpleFuture for AndThenFut<FutureA, FutureB>
where
    FutureA: SimpleFuture<Output = ()>,
    FutureB: SimpleFuture<Output = ()>,
{
    type Output = ();
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        if let Some(first) = &mut self.first {
            match first.poll(wake) {
                // 我们已经完成了第一个 Future， 可以将它移除， 然后准备开始运行第二个
                Poll::Ready(()) => self.first.take(),
                // 第一个 Future 还不能完成
                Poll::Pending => return Poll::Pending,
            };
        }

        // 运行到这里，说明第一个Future已经完成，尝试去完成第二个
        self.second.poll(wake)
    }
}
```

这些例子展示了在不需要内存对象分配以及深层嵌套回调的情况下，该如何使用 `Future` 特征去表达异步控制流。 在了解了基础的控制流后，我们再来看看真实的 `Future` 特征有何不同之处。

```rust
trait Future {
    type Output;
    fn poll(
        // 首先值得注意的地方是，`self`的类型从`&mut self`变成了`Pin<&mut Self>`:
        self: Pin<&mut Self>,
        // 其次将`wake: fn()` 修改为 `cx: &mut Context<'_>`:
        cx: &mut Context<'_>,
    ) -> Poll<Self::Output>;
}
```

首先这里多了一个 `Pin` ，关于它我们会在后面章节详细介绍，现在你只需要知道使用它可以创建一个无法被移动的 `Future` ，因为无法被移动，因此它将具有固定的内存地址，意味着我们可以存储它的指针(如果内存地址可能会变动，那存储指针地址将毫无意义！)，也意味着可以实现一个自引用数据结构: `struct MyFut { a: i32, ptr_to_a: *const i32 }`。 而对于 `async/await` 来说，`Pin` 是不可或缺的关键特性。

其次，从 `wake: fn()` 变成了 `&mut Context<'_>` 。意味着 `wake` 函数可以携带数据了，为何要携带数据？考虑一个真实世界的场景，一个复杂应用例如 web 服务器可能有数千连接同时在线，那么同时就有数千 `Future` 在被同时管理着，如果不能携带数据，当一个 `Future` 调用 `wake` 后，执行器该如何知道是哪个 `Future` 调用了 `wake` ,然后进一步去 `poll` 对应的 `Future` ？没有办法！那之前的例子为啥就可以使用没有携带数据的 `wake` ？ 因为足够简单，不存在歧义性。

总之，在正式场景要进行 `wake` ，就必须携带上数据。 而 `Context` 类型通过提供一个 `Waker` 类型的值，就可以用来唤醒特定的的任务。

## 使用 Waker 来唤醒任务

对于 `Future` 来说，第一次被 `poll` 时无法完成任务是很正常的。但它需要确保在未来一旦准备好时，可以通知执行器再次对其进行 `poll` 进而继续往下执行，该通知就是通过 `Waker` 类型完成的。

`Waker` 提供了一个 `wake()` 方法可以用于告诉执行器：相关的任务可以被唤醒了，此时执行器就可以对相应的 `Future` 再次进行 `poll` 操作。

#### 构建一个定时器

下面一起来实现一个简单的定时器 `Future` 。为了让例子尽量简单，当计时器创建时，我们会启动一个线程接着让该线程进入睡眠，等睡眠结束后再通知给 `Future` 。

注意本例子还会在后面继续使用，因此我们重新创建一个工程来演示：使用 `cargo new --lib timer_future` 来创建一个新工程，在 `lib` 包的根路径 `src/lib.rs` 中添加以下内容：

```rust
use std::{
    future::Future,
    pin::Pin,
    sync::{Arc, Mutex},
    task::{Context, Poll, Waker},
    thread,
    time::Duration,
};
```

继续来实现 `Future` 定时器，之前提到: 新建线程在睡眠结束后会需要将状态同步给定时器 `Future` ，由于是多线程环境，**我们需要使用 `Arc<Mutex<T>>`** 来作为一个共享状态，用于在新线程和 `Future` 定时器间共享。

```rust
pub struct TimerFuture {
    shared_state: Arc<Mutex<SharedState>>,
}

/// 在Future和等待的线程间共享状态
struct SharedState {
    /// 定时(睡眠)是否结束
    completed: bool,

    /// 当睡眠结束后，线程可以用`waker`通知`TimerFuture`来唤醒任务
    waker: Option<Waker>,
}
```

下面给出 `Future` 的具体实现:

```rust
impl Future for TimerFuture {
    type Output = ();
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // 通过检查共享状态，来确定定时器是否已经完成
        let mut shared_state = self.shared_state.lock().unwrap();
        if shared_state.completed {
            Poll::Ready(())
        } else {
            // 设置`waker`，这样新线程在睡眠(计时)结束后可以唤醒当前的任务，接着再次对`Future`进行`poll`操作,
            //
            // 下面的`clone`每次被`poll`时都会发生一次，实际上，应该是只`clone`一次更加合理。
            // 选择每次都`clone`的原因是： `TimerFuture`可以在执行器的不同任务间移动，如果只克隆一次，
            // 那么获取到的`waker`可能已经被篡改并指向了其它任务，最终导致执行器运行了错误的任务
            shared_state.waker = Some(cx.waker().clone());
            Poll::Pending
        }
    }
}
```

代码很简单，只要新线程设置了 `shared_state.completed = true` ，那任务就能顺利结束。如果没有设置，会为当前的任务克隆一份 `Waker` ，这样新线程就可以使用它来唤醒当前的任务。

最后，再来创建一个 API 用于构建定时器和启动计时线程:

```rust
impl TimerFuture {
    /// 创建一个新的`TimerFuture`，在指定的时间结束后，该`Future`可以完成
    pub fn new(duration: Duration) -> Self {
        let shared_state = Arc::new(Mutex::new(SharedState {
            completed: false,
            waker: None,
        }));

        // 创建新线程
        let thread_shared_state = shared_state.clone();
        thread::spawn(move || {
            // 睡眠指定时间实现计时功能
            thread::sleep(duration);
            let mut shared_state = thread_shared_state.lock().unwrap();
            // 通知执行器定时器已经完成，可以继续`poll`对应的`Future`了
            shared_state.completed = true;
            if let Some(waker) = shared_state.waker.take() {
                waker.wake()
            }
        });

        TimerFuture { shared_state }
    }
}
```

至此，一个简单的定时器 `Future` 就已创建成功，那么该如何使用它呢？相信部分爱动脑筋的读者已经猜到了：我们需要创建一个执行器，才能让程序动起来。

## 执行器 Executor

Rust 的 `Future` 是惰性的：只有屁股上拍一拍，它才会努力动一动。其中一个推动它的方式就是在 `async` 函数中使用 `.await` 来调用另一个 `async` 函数，但是这个只能解决 `async` 内部的问题，那么这些最外层的 `async` 函数，谁来推动它们运行呢？答案就是我们之前多次提到的执行器 `executor` 。

执行器会管理一批 `Future` (最外层的 `ascyn` 函数)，然后通过不停地 `poll` 推动它们直到完成。 最开始，执行器会先 `poll` 一次 `Future` ，后面就不会主动去 `poll` 了，而是等待 `Future` 通过调用 `wake` 函数来通知它可以继续，它才会继续去 `poll` 。这种**wake 通知然后 poll**的方式会不断重复，直到 `Future` 完成。

#### 构建执行器

下面我们将实现一个简单的执行器，它可以同时并发运行多个 `Future` 。例子中，需要用到 `futures` 包的 `ArcWake` 特征，它可以提供一个方便的途径去构建一个 `Waker` 。编辑 `Cargo.toml` ，添加下面依赖:

```rust
[dependencies]
futures = "0.3"
```

在之前的内容中，我们在 `src/lib.rs` 中创建了定时器 `Future` ，现在在 `src/main.rs` 中来创建程序的主体内容，开始之前，先引入所需的包：

```rust
use {
    futures::{
        future::{BoxFuture, FutureExt},
        task::{waker_ref, ArcWake},
    },
    std::{
        future::Future,
        sync::mpsc::{sync_channel, Receiver, SyncSender},
        sync::{Arc, Mutex},
        task::{Context, Poll},
        time::Duration,
    },
    // 引入之前实现的定时器模块
    timer_future::TimerFuture,
};
```

执行器需要从一个消息通道( `channel` )中拉取事件，然后运行它们。当一个任务准备好后（可以继续执行），它会将自己放入消息通道中，然后等待执行器 `poll` 。

```rust
/// 任务执行器，负责从通道中接收任务然后执行
struct Executor {
    ready_queue: Receiver<Arc<Task>>,
}

/// `Spawner`负责创建新的`Future`然后将它发送到任务通道中
#[derive(Clone)]
struct Spawner {
    task_sender: SyncSender<Arc<Task>>,
}

/// 一个Future，它可以调度自己(将自己放入任务通道中)，然后等待执行器去`poll`
struct Task {
    /// 进行中的Future，在未来的某个时间点会被完成
    ///
    /// 按理来说`Mutex`在这里是多余的，因为我们只有一个线程来执行任务。但是由于
    /// Rust并不聪明，它无法知道`Future`只会在一个线程内被修改，并不会被跨线程修改。因此
    /// 我们需要使用`Mutex`来满足这个笨笨的编译器对线程安全的执着。
    ///
    /// 如果是生产级的执行器实现，不会使用`Mutex`，因为会带来性能上的开销，取而代之的是使用`UnsafeCell`
    future: Mutex<Option<BoxFuture<'static, ()>>>,

    /// 可以将该任务自身放回到任务通道中，等待执行器的poll
    task_sender: SyncSender<Arc<Task>>,
}

fn new_executor_and_spawner() -> (Executor, Spawner) {
    // 任务通道允许的最大缓冲数(任务队列的最大长度)
    // 当前的实现仅仅是为了简单，在实际的执行中，并不会这么使用
    const MAX_QUEUED_TASKS: usize = 10_000;
    let (task_sender, ready_queue) = sync_channel(MAX_QUEUED_TASKS);
    (Executor { ready_queue }, Spawner { task_sender })
}
```

下面再来添加一个方法用于生成 `Future` , 然后将它放入任务通道中:

```rust
impl Spawner {
    fn spawn(&self, future: impl Future<Output = ()> + 'static + Send) {
        let future = future.boxed();
        let task = Arc::new(Task {
            future: Mutex::new(Some(future)),
            task_sender: self.task_sender.clone(),
        });
        self.task_sender.send(task).expect("任务队列已满");
    }
}
```

在执行器 `poll` 一个 `Future` 之前，首先需要调用 `wake` 方法进行唤醒，然后再由 `Waker` 负责调度该任务并将其放入任务通道中。创建 `Waker` 的最简单的方式就是实现 `ArcWake` 特征，先来为我们的任务实现 `ArcWake` 特征，这样它们就能被转变成 `Waker` 然后被唤醒:

```rust
impl ArcWake for Task {
    fn wake_by_ref(arc_self: &Arc<Self>) {
        // 通过发送任务到任务管道的方式来实现`wake`，这样`wake`后，任务就能被执行器`poll`
        let cloned = arc_self.clone();
        arc_self
            .task_sender
            .send(cloned)
            .expect("任务队列已满");
    }
}
```

当任务实现了 `ArcWake` 特征后，它就变成了 `Waker` ，在调用 `wake()` 对其唤醒后会将任务复制一份所有权( `Arc` )，然后将其发送到任务通道中。最后我们的执行器将从通道中获取任务，然后进行 `poll` 执行：

```rust
impl Executor {
    fn run(&self) {
        while let Ok(task) = self.ready_queue.recv() {
            // 获取一个future，若它还没有完成(仍然是Some，不是None)，则对它进行一次poll并尝试完成它
            let mut future_slot = task.future.lock().unwrap();
            if let Some(mut future) = future_slot.take() {
                // 基于任务自身创建一个 `LocalWaker`
                let waker = waker_ref(&task);
                let context = &mut Context::from_waker(&*waker);
                // `BoxFuture<T>`是`Pin<Box<dyn Future<Output = T> + Send + 'static>>`的类型别名
                // 通过调用`as_mut`方法，可以将上面的类型转换成`Pin<&mut dyn Future + Send + 'static>`
                if future.as_mut().poll(context).is_pending() {
                    // Future还没执行完，因此将它放回任务中，等待下次被poll
                    *future_slot = Some(future);
                }
            }
        }
    }
}
```

恭喜！我们终于拥有了自己的执行器，下面再来写一段代码使用该执行器去运行之前的定时器 `Future` ：

```rust
fn main() {
    let (executor, spawner) = new_executor_and_spawner();

    // 生成一个任务
    spawner.spawn(async {
        println!("howdy!");
        // 创建定时器Future，并等待它完成
        TimerFuture::new(Duration::new(2, 0)).await;
        println!("done!");
    });

    // drop掉任务，这样执行器就知道任务已经完成，不会再有新的任务进来
    drop(spawner);

    // 运行执行器直到任务队列为空
    // 任务运行后，会先打印`howdy!`, 暂停2秒，接着打印 `done!`
    executor.run();
}
```

## 执行器和系统 IO

前面我们一起看过一个使用 `Future` 从 `Socket` 中异步读取数据的例子:

```rust
pub struct SocketRead<'a> {
    socket: &'a Socket,
}

impl SimpleFuture for SocketRead<'_> {
    type Output = Vec<u8>;

    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        if self.socket.has_data_to_read() {
            // socket有数据，写入buffer中并返回
            Poll::Ready(self.socket.read_buf())
        } else {
            // socket中还没数据
            //
            // 注册一个`wake`函数，当数据可用时，该函数会被调用，
            // 然后当前Future的执行器会再次调用`poll`方法，此时就可以读取到数据
            self.socket.set_readable_callback(wake);
            Poll::Pending
        }
    }
}
```

该例子中，`Future` 将从 `Socket` 读取数据，若当前还没有数据，则会让出当前线程的所有权，允许执行器去执行其它的 `Future` 。当数据准备好后，会调用 `wake()` 函数将该 `Future` 的任务放入任务通道中，等待执行器的 `poll` 。

关于该流程已经反复讲了很多次，相信大家应该非常清楚了。然而该例子中还有一个疑问没有解决：

- `set_readable_callback` 方法到底是怎么工作的？怎么才能知道 `socket` 中的数据已经可以被读取了？

关于第二点，其中一个简单粗暴的方法就是使用一个新线程不停的检查 `socket` 中是否有了数据，当有了后，就调用 `wake()` 函数。该方法确实可以满足需求，但是性能着实太低了，需要为每个阻塞的 `Future` 都创建一个单独的线程！

在现实世界中，该问题往往是通过操作系统提供的 `IO` 多路复用机制来完成，例如 `Linux` 中的 **`epoll`**，`FreeBSD` 和 `macOS` 中的 **`kqueue`** ，`Windows` 中的 **`IOCP`**, `Fuchisa`中的 **`ports`** 等(可以通过 Rust 的跨平台包 `mio` 来使用它们)。借助 IO 多路复用机制，可以实现一个线程同时阻塞地去等待多个异步 IO 事件，一旦某个事件完成就立即退出阻塞并返回数据。相关实现类似于以下代码：

```rust
struct IoBlocker {
    /* ... */
}

struct Event {
    // Event的唯一ID，该事件发生后，就会被监听起来
    id: usize,

    // 一组需要等待或者已发生的信号
    signals: Signals,
}

impl IoBlocker {
    /// 创建需要阻塞等待的异步IO事件的集合
    fn new() -> Self { /* ... */ }

    /// 对指定的IO事件表示兴趣
    fn add_io_event_interest(
        &self,

        /// 事件所绑定的socket
        io_object: &IoObject,

        event: Event,
    ) { /* ... */ }

    /// 进入阻塞，直到某个事件出现
    fn block(&self) -> Event { /* ... */ }
}

let mut io_blocker = IoBlocker::new();
io_blocker.add_io_event_interest(
    &socket_1,
    Event { id: 1, signals: READABLE },
);
io_blocker.add_io_event_interest(
    &socket_2,
    Event { id: 2, signals: READABLE | WRITABLE },
);
let event = io_blocker.block();

// 当socket的数据可以读取时，打印 "Socket 1 is now READABLE"
println!("Socket {:?} is now {:?}", event.id, event.signals);
```

这样，我们只需要一个执行器线程，它会接收 IO 事件并将其分发到对应的 `Waker` 中，接着后者会唤醒相关的任务，最终通过执行器 `poll` 后，任务可以顺利的继续执行, 这种 IO 读取流程可以不停的循环，直到 `socket` 关闭。



# 定海神针 Pin 和 Unpin

在 Rust 异步编程中，有一个定海神针般的存在，它就是 `Pin` ，作用说简单也简单，说复杂也非常复杂，当初刚出来时就连一些 Rust 大佬都一头雾水，何况瑟瑟发抖的我。好在今非昔比，目前网上的资料已经很全，而我就借花献佛，给大家好好讲讲这个`Pin`。

在 Rust 中，所有的类型可以分为两类:

- **类型的值可以在内存中安全地被移动**，例如数值、字符串、布尔值、结构体、枚举，总之你能想到的几乎所有类型都可以落入到此范畴内
- **自引用类型**，大魔王来了，大家快跑，在之前章节我们已经见识过它的厉害

下面就是一个自引用类型

```rust
struct SelfRef {
    value: String,
    pointer_to_value: *mut String,
}
```

在上面的结构体中，`pointer_to_value` 是一个裸指针，指向第一个字段 `value` 持有的字符串 `String` 。很简单对吧？现在考虑一个情况， 若`String` 被移动了怎么办？

此时一个致命的问题就出现了：新的字符串的内存地址变了，而 `pointer_to_value` 依然指向之前的地址，一个重大 bug 就出现了！

灾难发生，英雄在哪？只见 `Pin` 闪亮登场，它可以防止一个类型在内存中被移动。再来回忆下之前在 `Future` 章节中，我们提到过在 `poll` 方法的签名中有一个 `self: Pin<&mut Self>` ，那么为何要在这里使用 `Pin` 呢？

## 为何需要 Pin

其实 `Pin` 还有一个小伙伴 `UnPin` ，与前者相反，后者表示类型可以在内存中安全地移动。在深入之前，我们先来回忆下 `async/.await` 是如何工作的:

```rust
let fut_one = /* ... */; // Future 1
let fut_two = /* ... */; // Future 2
async move {
    fut_one.await;
    fut_two.await;
}
```

在底层，`async` 会创建一个实现了 `Future` 的匿名类型，并提供了一个 `poll` 方法：

```rust
// `async { ... }`语句块创建的 `Future` 类型
struct AsyncFuture {
    fut_one: FutOne,
    fut_two: FutTwo,
    state: State,
}

// `async` 语句块可能处于的状态
enum State {
    AwaitingFutOne,
    AwaitingFutTwo,
    Done,
}

impl Future for AsyncFuture {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        loop {
            match self.state {
                State::AwaitingFutOne => match self.fut_one.poll(..) {
                    Poll::Ready(()) => self.state = State::AwaitingFutTwo,
                    Poll::Pending => return Poll::Pending,
                }
                State::AwaitingFutTwo => match self.fut_two.poll(..) {
                    Poll::Ready(()) => self.state = State::Done,
                    Poll::Pending => return Poll::Pending,
                }
                State::Done => return Poll::Ready(()),
            }
        }
    }
}
```

当 `poll` 第一次被调用时，它会去查询 `fut_one` 的状态，若 `fut_one` 无法完成，则 `poll` 方法会返回。未来对 `poll` 的调用将从上一次调用结束的地方开始。该过程会一直持续，直到 `Future` 完成为止。

然而，如果我们的 `async` 语句块中使用了引用类型，会发生什么？例如下面例子：

```rust
async {
    let mut x = [0; 128];
    let read_into_buf_fut = read_into_buf(&mut x);
    read_into_buf_fut.await;
    println!("{:?}", x);
}
```

这段代码会编译成下面的形式：

```rust
struct ReadIntoBuf<'a> {
    buf: &'a mut [u8], // 指向下面的`x`字段
}

struct AsyncFuture {
    x: [u8; 128],
    read_into_buf_fut: ReadIntoBuf<'what_lifetime?>,
}
```

这里，`ReadIntoBuf` 拥有一个引用字段，指向了结构体的另一个字段 `x` ，一旦 `AsyncFuture` 被移动，那 `x` 的地址也将随之变化，此时对 `x` 的引用就变成了不合法的，也就是 `read_into_buf_fut.buf` 会变为不合法的。

若能将 `Future` 在内存中固定到一个位置，就可以避免这种问题的发生，也就可以安全的创建上面这种引用类型。

## Unpin

事实上，绝大多数类型都不在意是否被移动(开篇提到的第一种类型)，因此它们都**自动实现**了 `Unpin` 特征。

从名字推测，大家可能以为 `Pin` 和 `Unpin` 都是特征吧？实际上，`Pin` 不按套路出牌，它是一个结构体：

```rust
pub struct Pin<P> {
    pointer: P,
}
```

它包裹一个指针，并且能确保该指针指向的数据不会被移动，例如 `Pin<&mut T>` , `Pin<&T>` , `Pin<Box<T>>` ，都能确保 `T` 不会被移动。

<img alt="" src="https://pic1.zhimg.com/80/v2-de79f3a7a401588d671ecd121916cd90_1440w.png" class="center"  />

而 `Unpin` 才是一个特征，它表明一个类型可以随意被移动，那么问题来了，可以被 `Pin` 住的值，它有没有实现什么特征呢？ 答案很出乎意料，可以被 `Pin` 住的值实现的特征是 `!Unpin` ，大家可能之前没有见过，但是它其实很简单，`!` 代表没有实现某个特征的意思，`!Unpin` 说明类型没有实现 `Unpin` 特征，那自然就可以被 `Pin` 了。

那是不是意味着类型如果实现了 `Unpin` 特征，就不能被 `Pin` 了？其实，还是可以 `Pin` 的，毕竟它只是一个结构体，你可以随意使用，**但是不再有任何效果而已，该值一样可以被移动**！

例如 `Pin<&mut u8>` ，显然 `u8` 实现了 `Unpin` 特征，它可以在内存中被移动，因此 `Pin<&mut u8>` 跟 `&mut u8` 实际上并无区别，一样可以被移动。

因此，一个类型如果不能被移动，它必须实现 `!Unpin` 特征。如果大家对 `Pin` 、 `Unpin` 还是模模糊糊，建议再重复看一遍之前的内容，理解它们对于我们后面要讲到的内容非常重要！

如果将 `Unpin` 与之前章节学过的 [`Send/Sync`](https://course.rs/advance/concurrency-with-threads/send-sync.html) 进行下对比，会发现它们都很像：

- 都是标记特征( marker trait )，该特征未定义任何行为，非常适用于标记
- 都可以通过`!`语法去除实现
- 绝大多数情况都是自动实现, 无需我们的操心

## 深入理解 Pin

对于上面的问题，我们可以简单的归结为如何在 Rust 中处理自引用类型(果然，只要是难点，都和自引用脱离不了关系)，下面用一个稍微简单点的例子来理解下 `Pin` :

```rust
#[derive(Debug)]
struct Test {
    a: String,
    b: *const String,
}

impl Test {
    fn new(txt: &str) -> Self {
        Test {
            a: String::from(txt),
            b: std::ptr::null(),
        }
    }

    fn init(&mut self) {
        let self_ref: *const String = &self.a;
        self.b = self_ref;
    }

    fn a(&self) -> &str {
        &self.a
    }

    fn b(&self) -> &String {
        assert!(!self.b.is_null(), "Test::b called without Test::init being called first");
        unsafe { &*(self.b) }
    }
}
```

`Test` 提供了方法用于获取字段 `a` 和 `b` 的值的引用。这里`b` 是 `a` 的一个引用，但是我们并没有使用引用类型而是用了裸指针，原因是：Rust 的借用规则不允许我们这样用，因为不符合生命周期的要求。 此时的 `Test` 就是一个自引用结构体。

如果不移动任何值，那么上面的例子将没有任何问题，例如:

```rust
fn main() {
    let mut test1 = Test::new("test1");
    test1.init();
    let mut test2 = Test::new("test2");
    test2.init();

    println!("a: {}, b: {}", test1.a(), test1.b());
    println!("a: {}, b: {}", test2.a(), test2.b());

}
```

输出非常正常：

```console
a: test1, b: test1
a: test2, b: test2
```

明知山有虎，偏向虎山行，这才是我辈年轻人的风华。既然移动数据会导致指针不合法，那我们就移动下数据试试，将 `test` 和 `test2` 进行下交换：

```rust
fn main() {
    let mut test1 = Test::new("test1");
    test1.init();
    let mut test2 = Test::new("test2");
    test2.init();

    println!("a: {}, b: {}", test1.a(), test1.b());
    std::mem::swap(&mut test1, &mut test2);
    println!("a: {}, b: {}", test2.a(), test2.b());

}
```

按理来说，这样修改后，输出应该如下:

```rust
a: test1, b: test1
a: test1, b: test1
```

但是实际运行后，却产生了下面的输出:

```rust
a: test1, b: test1
a: test1, b: test2
```

原因是 `test2.b` 指针依然指向了旧的地址，而该地址对应的值现在在 `test1` 里，最终会打印出意料之外的值。

如果大家还是将信将疑，那再看看下面的代码：

```rust
fn main() {
    let mut test1 = Test::new("test1");
    test1.init();
    let mut test2 = Test::new("test2");
    test2.init();

    println!("a: {}, b: {}", test1.a(), test1.b());
    std::mem::swap(&mut test1, &mut test2);
    test1.a = "I've totally changed now!".to_string();
    println!("a: {}, b: {}", test2.a(), test2.b());

}
```

下面的图片也可以帮助更好的理解这个过程：

<img alt="" src="https://pica.zhimg.com/80/v2-eaeb33da283dc1063b862d2307821976_1440w.jpg" class="center"  />

## Pin 在实践中的运用

在理解了 `Pin` 的作用后，我们再来看看它怎么帮我们解决问题。

#### 将值固定到栈上

回到之前的例子，我们可以用 `Pin` 来解决指针指向的数据被移动的问题:

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

#[derive(Debug)]
struct Test {
    a: String,
    b: *const String,
    _marker: PhantomPinned,
}


impl Test {
    fn new(txt: &str) -> Self {
        Test {
            a: String::from(txt),
            b: std::ptr::null(),
            _marker: PhantomPinned, // 这个标记可以让我们的类型自动实现特征`!Unpin`
        }
    }

    fn init(self: Pin<&mut Self>) {
        let self_ptr: *const String = &self.a;
        let this = unsafe { self.get_unchecked_mut() };
        this.b = self_ptr;
    }

    fn a(self: Pin<&Self>) -> &str {
        &self.get_ref().a
    }

    fn b(self: Pin<&Self>) -> &String {
        assert!(!self.b.is_null(), "Test::b called without Test::init being called first");
        unsafe { &*(self.b) }
    }
}
```

上面代码中，我们使用了一个标记类型 `PhantomPinned` 将自定义结构体 `Test` 变成了 `!Unpin` (编译器会自动帮我们实现)，因此该结构体无法再被移动。

一旦类型实现了 `!Unpin` ，那将它的值固定到栈( `stack` )上就是不安全的行为，因此在代码中我们使用了 `unsafe` 语句块来进行处理，你也可以使用 [`pin_utils`](https://docs.rs/pin-utils/) 来避免 `unsafe` 的使用。

> BTW, Rust 中的 unsafe 其实没有那么可怕，虽然听上去很不安全，但是实际上 Rust 依然提供了很多机制来帮我们提升了安全性，因此不必像对待 Go 语言的 `unsafe` 那样去畏惧于使用 Rust 中的 `unsafe` ，大致使用原则总结如下：没必要用时，就不要用，当有必要用时，就大胆用，但是尽量控制好边界，让 `unsafe` 的范围尽可能小

此时，再去尝试移动被固定的值，就会导致**编译错误** ：

```rust
pub fn main() {
    // 此时的`test1`可以被安全的移动
    let mut test1 = Test::new("test1");
    // 新的`test1`由于使用了`Pin`，因此无法再被移动，这里的声明会将之前的`test1`遮蔽掉(shadow)
    let mut test1 = unsafe { Pin::new_unchecked(&mut test1) };
    Test::init(test1.as_mut());

    let mut test2 = Test::new("test2");
    let mut test2 = unsafe { Pin::new_unchecked(&mut test2) };
    Test::init(test2.as_mut());

    println!("a: {}, b: {}", Test::a(test1.as_ref()), Test::b(test1.as_ref()));
    std::mem::swap(test1.get_mut(), test2.get_mut());
    println!("a: {}, b: {}", Test::a(test2.as_ref()), Test::b(test2.as_ref()));
}
```

注意到之前的粗体字了吗？是的，Rust 并不是在运行时做这件事，而是在编译期就完成了，因此没有额外的性能开销！来看看报错:

```shell
error[E0277]: `PhantomPinned` cannot be unpinned
   --> src/main.rs:47:43
    |
47  |     std::mem::swap(test1.get_mut(), test2.get_mut());
    |                                           ^^^^^^^ within `Test`, the trait `Unpin` is not implemented for `PhantomPinned`
```

> 需要注意的是固定在栈上非常依赖于你写出的 `unsafe` 代码的正确性。我们知道 `&'a mut T` 可以固定的生命周期是 `'a` ，但是我们却不知道当生命周期 `'a` 结束后，该指针指向的数据是否会被移走。如果你的 `unsafe` 代码里这么实现了，那么就会违背 `Pin` 应该具有的作用！
>
> 一个常见的错误就是忘记去遮蔽(shadow )初始的变量，因为你可以 `drop` 掉 `Pin` ，然后在 `&'a mut T` 结束后去移动数据:
>
> ```rust
> fn main() {
>    let mut test1 = Test::new("test1");
>    let mut test1_pin = unsafe { Pin::new_unchecked(&mut test1) };
>    Test::init(test1_pin.as_mut());
>
>    drop(test1_pin);
>    println!(r#"test1.b points to "test1": {:?}..."#, test1.b);
>
>    let mut test2 = Test::new("test2");
>    mem::swap(&mut test1, &mut test2);
>    println!("... and now it points nowhere: {:?}", test1.b);
> }
> # use std::pin::Pin;
> # use std::marker::PhantomPinned;
> # use std::mem;
> #
> # #[derive(Debug)]
> # struct Test {
> #     a: String,
> #     b: *const String,
> #     _marker: PhantomPinned,
> # }
> #
> #
> # impl Test {
> #     fn new(txt: &str) -> Self {
> #         Test {
> #             a: String::from(txt),
> #             b: std::ptr::null(),
> #             // This makes our type `!Unpin`
> #             _marker: PhantomPinned,
> #         }
> #     }
> #
> #     fn init<'a>(self: Pin<&'a mut Self>) {
> #         let self_ptr: *const String = &self.a;
> #         let this = unsafe { self.get_unchecked_mut() };
> #         this.b = self_ptr;
> #     }
> #
> #     fn a<'a>(self: Pin<&'a Self>) -> &'a str {
> #         &self.get_ref().a
> #     }
> #
> #     fn b<'a>(self: Pin<&'a Self>) -> &'a String {
> #         assert!(!self.b.is_null(), "Test::b called without Test::init being called first");
> #         unsafe { &*(self.b) }
> #     }
> # }
> ```

#### 固定到堆上

将一个 `!Unpin` 类型的值固定到堆上，会给予该值一个稳定的内存地址，它指向的堆中的值在 `Pin` 后是无法被移动的。而且与固定在栈上不同，我们知道堆上的值在整个生命周期内都会被稳稳地固定住。

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

#[derive(Debug)]
struct Test {
    a: String,
    b: *const String,
    _marker: PhantomPinned,
}

impl Test {
    fn new(txt: &str) -> Pin<Box<Self>> {
        let t = Test {
            a: String::from(txt),
            b: std::ptr::null(),
            _marker: PhantomPinned,
        };
        let mut boxed = Box::pin(t);
        let self_ptr: *const String = &boxed.as_ref().a;
        unsafe { boxed.as_mut().get_unchecked_mut().b = self_ptr };

        boxed
    }

    fn a(self: Pin<&Self>) -> &str {
        &self.get_ref().a
    }

    fn b(self: Pin<&Self>) -> &String {
        unsafe { &*(self.b) }
    }
}

pub fn main() {
    let test1 = Test::new("test1");
    let test2 = Test::new("test2");

    println!("a: {}, b: {}",test1.as_ref().a(), test1.as_ref().b());
    println!("a: {}, b: {}",test2.as_ref().a(), test2.as_ref().b());
}
```

#### 将固定住的 `Future` 变为 `Unpin`

之前的章节我们有提到 `async` 函数返回的 `Future` 默认就是 `!Unpin` 的。

但是，在实际应用中，一些函数会要求它们处理的 `Future` 是 `Unpin` 的，此时，若你使用的 `Future` 是 `!Unpin` 的，必须要使用以下的方法先将 `Future` 进行固定:

- `Box::pin`， 创建一个 `Pin<Box<T>>`
- `pin_utils::pin_mut!`， 创建一个 `Pin<&mut T>`

固定后获得的 `Pin<Box<T>>` 和 `Pin<&mut T>` 既可以用于 `Future` ，**又会自动实现 `Unpin`**。

```rust
use pin_utils::pin_mut; // `pin_utils` 可以在crates.io中找到

// 函数的参数是一个`Future`，但是要求该`Future`实现`Unpin`
fn execute_unpin_future(x: impl Future<Output = ()> + Unpin) { /* ... */ }

let fut = async { /* ... */ };
// 下面代码报错: 默认情况下，`fut` 实现的是`!Unpin`，并没有实现`Unpin`
// execute_unpin_future(fut);

// 使用`Box`进行固定
let fut = async { /* ... */ };
let fut = Box::pin(fut);
execute_unpin_future(fut); // OK

// 使用`pin_mut!`进行固定
let fut = async { /* ... */ };
pin_mut!(fut);
execute_unpin_future(fut); // OK
```

## 总结

相信大家看到这里，脑袋里已经快被 `Pin` 、 `Unpin` 、 `!Unpin` 整爆炸了，没事，我们再来火上浇油下:)

- 若 `T: Unpin` ( Rust 类型的默认实现)，那么 `Pin<'a, T>` 跟 `&'a mut T` 完全相同，也就是 `Pin` 将没有任何效果, 该移动还是照常移动
- 绝大多数标准库类型都实现了 `Unpin` ，事实上，对于 Rust 中你能遇到的绝大多数类型，该结论依然成立
  ，其中一个例外就是：`async/await` 生成的 `Future` 没有实现 `Unpin`
- 你可以通过以下方法为自己的类型添加 `!Unpin` 约束：
  - 使用文中提到的 `std::marker::PhantomPinned`
  - 使用`nightly` 版本下的 `feature flag`
- 可以将值固定到栈上，也可以固定到堆上
  - 将 `!Unpin` 值固定到栈上需要使用 `unsafe`
  - 将 `!Unpin` 值固定到堆上无需 `unsafe` ，可以通过 `Box::pin` 来简单的实现
- 当固定类型`T: !Unpin`时，你需要保证数据从被固定到被 drop 这段时期内，其内存不会变得非法或者被重用

# async/await 和 Stream 流处理

在入门章节中，我们简单学习了该如何使用 `async/.await`， 同时在后面也了解了一些底层原理，现在是时候继续深入了。

`async/.await`是 Rust 语法的一部分，它在遇到阻塞操作时( 例如 IO )会让出当前线程的所有权而不是阻塞当前线程，这样就允许当前线程继续去执行其它代码，最终实现并发。

有两种方式可以使用`async`： `async fn`用于声明函数，`async { ... }`用于声明语句块，它们会返回一个实现 `Future` 特征的值:

```rust
// `foo()`返回一个`Future<Output = u8>`,
// 当调用`foo().await`时，该`Future`将被运行，当调用结束后我们将获取到一个`u8`值
async fn foo() -> u8 { 5 }

fn bar() -> impl Future<Output = u8> {
    // 下面的`async`语句块返回`Future<Output = u8>`
    async {
        let x: u8 = foo().await;
        x + 5
    }
}
```

`async` 是懒惰的，直到被执行器 `poll` 或者 `.await` 后才会开始运行，其中后者是最常用的运行 `Future` 的方法。 当 `.await` 被调用时，它会尝试运行 `Future` 直到完成，但是若该 `Future` 进入阻塞，那就会让出当前线程的控制权。当 `Future` 后面准备再一次被运行时(例如从 `socket` 中读取到了数据)，执行器会得到通知，并再次运行该 `Future` ，如此循环，直到完成。

以上过程只是一个简述，详细内容在[底层探秘](https://course.rs/async-rust/async/future-excuting.html)中已经被深入讲解过，因此这里不再赘述。

## `async` 的生命周期

`async fn` 函数如果拥有引用类型的参数，那它返回的 `Future` 的生命周期就会被这些参数的生命周期所限制:

```rust
async fn foo(x: &u8) -> u8 { *x }

// 上面的函数跟下面的函数是等价的:
fn foo_expanded<'a>(x: &'a u8) -> impl Future<Output = u8> + 'a {
    async move { *x }
}
```

意味着 `async fn` 函数返回的 `Future` 必须满足以下条件: 当 `x` 依然有效时， 该 `Future` 就必须继续等待( `.await` ), 也就是说`x` 必须比 `Future`活得更久。

在一般情况下，在函数调用后就立即 `.await` 不会存在任何问题，例如`foo(&x).await`。但是，若 `Future` 被先存起来或发送到另一个任务或者线程，就可能存在问题了:

```rust
use std::future::Future;
fn bad() -> impl Future<Output = u8> {
    let x = 5;
    borrow_x(&x) // ERROR: `x` does not live long enough
}

async fn borrow_x(x: &u8) -> u8 { *x }
```

以上代码会报错，因为 `x` 的生命周期只到 `bad` 函数的结尾。 但是 `Future` 显然会活得更久：

```shell
error[E0597]: `x` does not live long enough
 --> src/main.rs:4:14
  |
4 |     borrow_x(&x) // ERROR: `x` does not live long enough
  |     ---------^^-
  |     |        |
  |     |        borrowed value does not live long enough
  |     argument requires that `x` is borrowed for `'static`
5 | }
  | - `x` dropped here while still borrowed
```

其中一个常用的解决方法就是将具有引用参数的 `async fn` 函数转变成一个具有 `'static` 生命周期的 `Future` 。 以上解决方法可以通过将参数和对 `async fn` 的调用放在同一个 `async` 语句块来实现:

```rust
use std::future::Future;

async fn borrow_x(x: &u8) -> u8 { *x }

fn good() -> impl Future<Output = u8> {
    async {
        let x = 5;
        borrow_x(&x).await
    }
}
```

如上所示，通过将参数移动到 `async` 语句块内， 我们将它的生命周期扩展到 `'static`， 并跟返回的 `Future` 保持了一致。

## async move

`async` 允许我们使用 `move` 关键字来将环境中变量的所有权转移到语句块内，就像闭包那样，好处是你不再发愁该如何解决借用生命周期的问题，坏处就是无法跟其它代码实现对变量的共享:

```rust
// 多个不同的 `async` 语句块可以访问同一个本地变量，只要它们在该变量的作用域内执行
async fn blocks() {
    let my_string = "foo".to_string();

    let future_one = async {
        // ...
        println!("{my_string}");
    };

    let future_two = async {
        // ...
        println!("{my_string}");
    };

    // 运行两个 Future 直到完成
    let ((), ()) = futures::join!(future_one, future_two);
}



// 由于`async move`会捕获环境中的变量，因此只有一个`async move`语句块可以访问该变量，
// 但是它也有非常明显的好处： 变量可以转移到返回的 Future 中，不再受借用生命周期的限制
fn move_block() -> impl Future<Output = ()> {
    let my_string = "foo".to_string();
    async move {
        // ...
        println!("{my_string}");
    }
}
```

## 当.await 遇见多线程执行器

需要注意的是，当使用多线程 `Future` 执行器( `executor` )时， `Future` 可能会在线程间被移动，因此 `async` 语句块中的变量必须要能在线程间传递。 至于 `Future` 会在线程间移动的原因是：它内部的任何`.await`都可能导致它被切换到一个新线程上去执行。

由于需要在多线程环境使用，意味着 `Rc`、 `RefCell` 、没有实现 `Send` 的所有权类型、没有实现 `Sync` 的引用类型，它们都是不安全的，因此无法被使用

> 需要注意！实际上它们还是有可能被使用的，只要在 `.await` 调用期间，它们没有在作用域范围内。

类似的原因，在 `.await` 时使用普通的锁也不安全，例如 `Mutex` 。原因是，它可能会导致线程池被锁：当一个任务获取锁 `A` 后，若它将线程的控制权还给执行器，然后执行器又调度运行另一个任务，该任务也去尝试获取了锁 `A` ，结果当前线程会直接卡死，最终陷入死锁中。

因此，为了避免这种情况的发生，我们需要使用 `futures` 包下的锁 `futures::lock` 来替代 `Mutex` 完成任务。

## Stream 流处理

`Stream` 特征类似于 `Future` 特征，但是前者在完成前可以生成多个值，这种行为跟标准库中的 `Iterator` 特征倒是颇为相似。

```rust
trait Stream {
    // Stream生成的值的类型
    type Item;

    // 尝试去解析Stream中的下一个值,
    // 若无数据，返回`Poll::Pending`, 若有数据，返回 `Poll::Ready(Some(x))`, `Stream`完成则返回 `Poll::Ready(None)`
    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<Option<Self::Item>>;
}
```

关于 `Stream` 的一个常见例子是消息通道（ `futures` 包中的）的消费者 `Receiver`。每次有消息从 `Send` 端发送后，它都可以接收到一个 `Some(val)` 值， 一旦 `Send` 端关闭(drop)，且消息通道中没有消息后，它会接收到一个 `None` 值。

```rust
async fn send_recv() {
    const BUFFER_SIZE: usize = 10;
    let (mut tx, mut rx) = mpsc::channel::<i32>(BUFFER_SIZE);

    tx.send(1).await.unwrap();
    tx.send(2).await.unwrap();
    drop(tx);

    // `StreamExt::next` 类似于 `Iterator::next`, 但是前者返回的不是值，而是一个 `Future<Output = Option<T>>`，
    // 因此还需要使用`.await`来获取具体的值
    assert_eq!(Some(1), rx.next().await);
    assert_eq!(Some(2), rx.next().await);
    assert_eq!(None, rx.next().await);
}
```

#### 迭代和并发

跟迭代器类似，我们也可以迭代一个 `Stream`。 例如使用`map`，`filter`，`fold`方法，以及它们的*遇到错误提前返回*的版本： `try_map`，`try_filter`，`try_fold`。

但是跟迭代器又有所不同，`for` 循环无法在这里使用，但是命令式风格的循环`while let`是可以用的，同时还可以使用`next` 和 `try_next` 方法:

```rust
async fn sum_with_next(mut stream: Pin<&mut dyn Stream<Item = i32>>) -> i32 {
    use futures::stream::StreamExt; // 引入 next
    let mut sum = 0;
    while let Some(item) = stream.next().await {
        sum += item;
    }
    sum
}

async fn sum_with_try_next(
    mut stream: Pin<&mut dyn Stream<Item = Result<i32, io::Error>>>,
) -> Result<i32, io::Error> {
    use futures::stream::TryStreamExt; // 引入 try_next
    let mut sum = 0;
    while let Some(item) = stream.try_next().await? {
        sum += item;
    }
    Ok(sum)
}
```

上面代码是一次处理一个值的模式，但是需要注意的是：**如果你选择一次处理一个值的模式，可能会造成无法并发，这就失去了异步编程的意义**。 因此，如果可以的话我们还是要选择从一个 `Stream` 并发处理多个值的方式，通过 `for_each_concurrent` 或 `try_for_each_concurrent` 方法来实现:

```rust
async fn jump_around(
    mut stream: Pin<&mut dyn Stream<Item = Result<u8, io::Error>>>,
) -> Result<(), io::Error> {
    use futures::stream::TryStreamExt; // 引入 `try_for_each_concurrent`
    const MAX_CONCURRENT_JUMPERS: usize = 100;

    stream.try_for_each_concurrent(MAX_CONCURRENT_JUMPERS, |num| async move {
        jump_n_times(num).await?;
        report_n_jumps(num).await?;
        Ok(())
    }).await?;

    Ok(())
}
```



# 使用`join!`和`select!`同时运行多个 Future

招数单一，杀伤力惊人，说的就是 `.await` ，但是光用它，还真做不到一招鲜吃遍天。比如我们该如何同时运行多个任务，而不是使用`.await`慢悠悠地排队完成。

## join!

`futures` 包中提供了很多实用的工具，其中一个就是 `join!`宏， 它允许我们同时等待多个不同 `Future` 的完成，且可以并发地运行这些 `Future`。

先来看一个不是很给力的、使用`.await`的版本:

```rust
async fn enjoy_book_and_music() -> (Book, Music) {
    let book = enjoy_book().await;
    let music = enjoy_music().await;
    (book, music)
}
```

这段代码可以顺利运行，但是有一个很大的问题，就是必须先看完书后，才能听音乐。咱们以前，谁又不是那个摇头晃脑爱读书(耳朵里偷偷塞着耳机，听的正 high)的好学生呢？

要支持同时看书和听歌，有些人可能会凭空生成下面代码：

```rust
// WRONG -- 别这么做
async fn enjoy_book_and_music() -> (Book, Music) {
    let book_future = enjoy_book();
    let music_future = enjoy_music();
    (book_future.await, music_future.await)
}
```

看上去像模像样，嗯，在某些语言中也许可以，但是 Rust 不行。因为在某些语言中，`Future`一旦创建就开始运行，等到返回的时候，基本就可以同时结束并返回了。 但是 Rust 中的 `Future` 是惰性的，直到调用 `.await` 时，才会开始运行。而那两个 `await` 由于在代码中有先后顺序，因此它们是顺序运行的。

为了正确的并发运行两个 `Future` ， 我们来试试 `futures::join!` 宏:

```rust
use futures::join;

async fn enjoy_book_and_music() -> (Book, Music) {
    let book_fut = enjoy_book();
    let music_fut = enjoy_music();
    join!(book_fut, music_fut)
}
```

`Duang`，目标顺利达成。同时`join!`会返回一个元组，里面的值是对应的`Future`执行结束后输出的值。

## try_join!

由于`join!`必须等待它管理的所有 `Future` 完成后才能完成，如果你希望在某一个 `Future` 报错后就立即停止所有 `Future` 的执行，可以使用 `try_join!`，特别是当 `Future` 返回 `Result` 时:

```rust
use futures::try_join;

async fn get_book() -> Result<Book, String> { /* ... */ Ok(Book) }
async fn get_music() -> Result<Music, String> { /* ... */ Ok(Music) }

async fn get_book_and_music() -> Result<(Book, Music), String> {
    let book_fut = get_book();
    let music_fut = get_music();
    try_join!(book_fut, music_fut)
}
```

有一点需要注意，传给 `try_join!` 的所有 `Future` 都必须拥有相同的错误类型。如果错误类型不同，可以考虑使用来自 `futures::future::TryFutureExt` 模块的 `map_err`和`err_info`方法将错误进行转换:

```rust
use futures::{
    future::TryFutureExt,
    try_join,
};

async fn get_book() -> Result<Book, ()> { /* ... */ Ok(Book) }
async fn get_music() -> Result<Music, String> { /* ... */ Ok(Music) }

async fn get_book_and_music() -> Result<(Book, Music), String> {
    let book_fut = get_book().map_err(|()| "Unable to get book".to_string());
    let music_fut = get_music();
    try_join!(book_fut, music_fut)
}
```

`join!`很好很强大，但是人无完人，J 无完 J, 它有一个很大的问题。

## select!

`join!`只有等所有 `Future` 结束后，才能集中处理结果，如果你想同时等待多个 `Future` ，且任何一个 `Future` 结束后，都可以立即被处理，可以考虑使用 `futures::select!`:

```rust
use futures::{
    future::FutureExt, // for `.fuse()`
    pin_mut,
    select,
};

async fn task_one() { /* ... */ }
async fn task_two() { /* ... */ }

async fn race_tasks() {
    let t1 = task_one().fuse();
    let t2 = task_two().fuse();

    pin_mut!(t1, t2);

    select! {
        () = t1 => println!("任务1率先完成"),
        () = t2 => println!("任务2率先完成"),
    }
}
```

上面的代码会同时并发地运行 `t1` 和 `t2`， 无论两者哪个先完成，都会调用对应的 `println!` 打印相应的输出，然后函数结束且不会等待另一个任务的完成。

但是，在实际项目中，我们往往需要等待多个任务都完成后，再结束，像上面这种其中一个任务结束就立刻结束的场景着实不多。

#### default 和 complete

`select!`还支持 `default` 和 `complete` 分支:

- `complete` 分支当所有的 `Future` 和 `Stream` 完成后才会被执行，它往往配合`loop`使用，`loop`用于循环完成所有的 `Future`
- `default`分支，若没有任何 `Future` 或 `Stream` 处于 `Ready` 状态， 则该分支会被立即执行

```rust
use futures::future;
use futures::select;
pub fn main() {
    let mut a_fut = future::ready(4);
    let mut b_fut = future::ready(6);
    let mut total = 0;

    loop {
        select! {
            a = a_fut => total += a,
            b = b_fut => total += b,
            complete => break,
            default => panic!(), // 该分支永远不会运行，因为`Future`会先运行，然后是`complete`
        };
    }
    assert_eq!(total, 10);
}
```

以上代码 `default` 分支由于最后一个运行，而在它之前 `complete` 分支已经通过 `break` 跳出了循环，因此`default`永远不会被执行。

如果你希望 `default` 也有机会露下脸，可以将 `complete` 的 `break` 修改为其它的，例如`println!("completed!")`，然后再观察下运行结果。

再回到 `select` 的第一个例子中，里面有一段代码长这样：

```rust
let t1 = task_one().fuse();
let t2 = task_two().fuse();

pin_mut!(t1, t2);
```

当时没有展开讲，相信大家也有疑惑，下面我们来一起看看。

#### 跟 `Unpin` 和 `FusedFuture` 进行交互

首先，`.fuse()`方法可以让 `Future` 实现 `FusedFuture` 特征， 而 `pin_mut!` 宏会为 `Future` 实现 `Unpin`特征，这两个特征恰恰是使用 `select` 所必须的:

- `Unpin`，由于 `select` 不会通过拿走所有权的方式使用`Future`，而是通过可变引用的方式去使用，这样当 `select` 结束后，该 `Future` 若没有被完成，它的所有权还可以继续被其它代码使用。
- `FusedFuture`的原因跟上面类似，当 `Future` 一旦完成后，那 `select` 就不能再对其进行轮询使用。`Fuse`意味着熔断，相当于 `Future` 一旦完成，再次调用`poll`会直接返回`Poll::Pending`。

只有实现了`FusedFuture`，`select` 才能配合 `loop` 一起使用。假如没有实现，就算一个 `Future` 已经完成了，它依然会被 `select` 不停的轮询执行。

`Stream` 稍有不同，它们使用的特征是 `FusedStream`。 通过`.fuse()`(也可以手动实现)实现了该特征的 `Stream`，对其调用`.next()` 或 `.try_next()`方法可以获取实现了`FusedFuture`特征的`Future`:

```rust
use futures::{
    stream::{Stream, StreamExt, FusedStream},
    select,
};

async fn add_two_streams(
    mut s1: impl Stream<Item = u8> + FusedStream + Unpin,
    mut s2: impl Stream<Item = u8> + FusedStream + Unpin,
) -> u8 {
    let mut total = 0;

    loop {
        let item = select! {
            x = s1.next() => x,
            x = s2.next() => x,
            complete => break,
        };
        if let Some(next_num) = item {
            total += next_num;
        }
    }

    total
}
```

## 在 select 循环中并发

一个很实用但又鲜为人知的函数是 `Fuse::terminated()` ，可以使用它构建一个空的 `Future` ，空自然没啥用，但是如果它能在后面再被填充呢？

考虑以下场景：当你要在`select`循环中运行一个任务，但是该任务却是在`select`循环内部创建时，上面的函数就非常好用了。

```rust
use futures::{
    future::{Fuse, FusedFuture, FutureExt},
    stream::{FusedStream, Stream, StreamExt},
    pin_mut,
    select,
};

async fn get_new_num() -> u8 { /* ... */ 5 }

async fn run_on_new_num(_: u8) { /* ... */ }

async fn run_loop(
    mut interval_timer: impl Stream<Item = ()> + FusedStream + Unpin,
    starting_num: u8,
) {
    let run_on_new_num_fut = run_on_new_num(starting_num).fuse();
    let get_new_num_fut = Fuse::terminated();
    pin_mut!(run_on_new_num_fut, get_new_num_fut);
    loop {
        select! {
            () = interval_timer.select_next_some() => {
                // 定时器已结束，若`get_new_num_fut`没有在运行，就创建一个新的
                if get_new_num_fut.is_terminated() {
                    get_new_num_fut.set(get_new_num().fuse());
                }
            },
            new_num = get_new_num_fut => {
                // 收到新的数字 -- 创建一个新的`run_on_new_num_fut`并丢弃掉旧的
                run_on_new_num_fut.set(run_on_new_num(new_num).fuse());
            },
            // 运行 `run_on_new_num_fut`
            () = run_on_new_num_fut => {},
            // 若所有任务都完成，直接 `panic`， 原因是 `interval_timer` 应该连续不断的产生值，而不是结束
            //后，执行到 `complete` 分支
            complete => panic!("`interval_timer` completed unexpectedly"),
        }
    }
}
```

当某个 `Future` 有多个拷贝都需要同时运行时，可以使用 `FuturesUnordered` 类型。下面的例子跟上个例子大体相似，但是它会将 `run_on_new_num_fut` 的每一个拷贝都运行到完成，而不是像之前那样一旦创建新的就终止旧的。

```rust
use futures::{
    future::{Fuse, FusedFuture, FutureExt},
    stream::{FusedStream, FuturesUnordered, Stream, StreamExt},
    pin_mut,
    select,
};

async fn get_new_num() -> u8 { /* ... */ 5 }

async fn run_on_new_num(_: u8) -> u8 { /* ... */ 5 }


// 使用从 `get_new_num` 获取的最新数字 来运行 `run_on_new_num`
//
// 每当计时器结束后，`get_new_num` 就会运行一次，它会立即取消当前正在运行的`run_on_new_num` ,
// 并且使用新返回的值来替换
async fn run_loop(
    mut interval_timer: impl Stream<Item = ()> + FusedStream + Unpin,
    starting_num: u8,
) {
    let mut run_on_new_num_futs = FuturesUnordered::new();
    run_on_new_num_futs.push(run_on_new_num(starting_num));
    let get_new_num_fut = Fuse::terminated();
    pin_mut!(get_new_num_fut);
    loop {
        select! {
            () = interval_timer.select_next_some() => {
                 // 定时器已结束，若`get_new_num_fut`没有在运行，就创建一个新的
                if get_new_num_fut.is_terminated() {
                    get_new_num_fut.set(get_new_num().fuse());
                }
            },
            new_num = get_new_num_fut => {
                 // 收到新的数字 -- 创建一个新的`run_on_new_num_fut` (并没有像之前的例子那样丢弃掉旧值)
                run_on_new_num_futs.push(run_on_new_num(new_num));
            },
            // 运行 `run_on_new_num_futs`, 并检查是否有已经完成的
            res = run_on_new_num_futs.select_next_some() => {
                println!("run_on_new_num_fut returned {:?}", res);
            },
            // 若所有任务都完成，直接 `panic`， 原因是 `interval_timer` 应该连续不断的产生值，而不是结束
            //后，执行到 `complete` 分支
            complete => panic!("`interval_timer` completed unexpectedly"),
        }
    }
}
```



# 一些疑难问题的解决办法

`async` 在 Rust 依然比较新，疑难杂症少不了，而它们往往还处于活跃开发状态，短时间内无法被解决，因此才有了本文。下面一起来看看这些问题以及相应的临时解决方案。

## 在 async 语句块中使用 ?

`async` 语句块和 `async fn` 最大的区别就是前者无法显式的声明返回值，在大多数时候这都不是问题，但是当配合 `?` 一起使用时，问题就有所不同:

```rust
async fn foo() -> Result<u8, String> {
    Ok(1)
}
async fn bar() -> Result<u8, String> {
    Ok(1)
}
pub fn main() {
    let fut = async {
        foo().await?;
        bar().await?;
        Ok(())
    };
}
```

以上代码编译后会报错:

```shell
error[E0282]: type annotations needed
  --> src/main.rs:14:9
   |
11 |     let fut = async {
   |         --- consider giving `fut` a type
...
14 |         Ok(1)
   |         ^^ cannot infer type for type parameter `E` declared on the enum `Result`
```

原因在于编译器无法推断出 `Result<T, E>`中的 `E` 的类型， 而且编译器的提示```consider giving `fut` a type```你也别傻乎乎的相信，然后尝试半天，最后无奈放弃：目前还没有办法为 `async` 语句块指定返回类型。

既然编译器无法推断出类型，那咱就给它更多提示，可以使用 `::< ... >` 的方式来增加类型注释：

```rust
let fut = async {
    foo().await?;
    bar().await?;
    Ok::<(), String>(()) // 在这一行进行显式的类型注释
};
```

给予类型注释后此时编译器就知道`Result<T, E>`中的 `E` 的类型是`String`，进而成功通过编译。

## async 函数和 Send 特征

在多线程章节我们深入讲过 `Send` 特征对于多线程间数据传递的重要性，对于 `async fn` 也是如此，它返回的 `Future` 能否在线程间传递的关键在于 `.await` 运行过程中，作用域中的变量类型是否是 `Send`。

学到这里，相信大家已经很清楚`Rc`无法在多线程环境使用，原因就在于它并未实现 `Send` 特征，那咱就用它来做例子:

```rust
use std::rc::Rc;

#[derive(Default)]
struct NotSend(Rc<()>);
```

事实上，未实现 `Send` 特征的变量可以出现在 `async fn` 语句块中:

```rust
async fn bar() {}
async fn foo() {
    NotSend::default();
    bar().await;
}

fn require_send(_: impl Send) {}

fn main() {
    require_send(foo());
}
```

即使上面的 `foo` 返回的 `Future` 是 `Send`， 但是在它内部短暂的使用 `NotSend` 依然是安全的，原因在于它的作用域并没有影响到 `.await`，下面来试试声明一个变量，然后让 `.await`的调用处于变量的作用域中试试:

```rust
async fn foo() {
    let x = NotSend::default();
    bar().await;
}
```

不出所料，错误如期而至:

```shell
error: future cannot be sent between threads safely
  --> src/main.rs:17:18
   |
17 |     require_send(foo());
   |                  ^^^^^ future returned by `foo` is not `Send`
   |
   = help: within `impl futures::Future<Output = ()>`, the trait `std::marker::Send` is not implemented for `Rc<()>`
note: future is not `Send` as this value is used across an await
  --> src/main.rs:11:5
   |
10 |     let x = NotSend::default();
   |         - has type `NotSend` which is not `Send`
11 |     bar().await;
   |     ^^^^^^^^^^^ await occurs here, with `x` maybe used later
12 | }
   | - `x` is later dropped here
```

提示很清晰，`.await`在运行时处于 `x` 的作用域内。在之前章节有提到过， `.await` 有可能被执行器调度到另一个线程上运行，而 `Rc` 并没有实现 `Send`，因此编译器无情拒绝了咱们。

其中一个可能的解决方法是在 `.await` 之前就使用 `std::mem::drop` 释放掉 `Rc`，但是很可惜，截止今天，该方法依然不能解决这种问题。

不知道有多少同学还记得语句块 `{ ... }` 在 Rust 中其实具有非常重要的作用(特别是相比其它大多数语言来说时)：可以将变量声明在语句块内，当语句块结束时，变量会自动被 Drop，这个规则可以帮助我们解决很多借用冲突问题，特别是在 `NLL` 出来之前。

```rust
async fn foo() {
    {
        let x = NotSend::default();
    }
    bar().await;
}
```

是不是很简单？最终我们还是通过 Drop 的方式解决了这个问题，当然，还是期待未来 `std::mem::drop` 也能派上用场。

## 递归使用 async fn

在内部实现中，`async fn`被编译成一个状态机，这会导致递归使用 `async fn` 变得较为复杂， 因为编译后的状态机还需要包含自身。

```rust
// foo函数:
async fn foo() {
    step_one().await;
    step_two().await;
}
// 会被编译成类似下面的类型：
enum Foo {
    First(StepOne),
    Second(StepTwo),
}

// 因此recursive函数
async fn recursive() {
    recursive().await;
    recursive().await;
}

// 会生成类似以下的类型
enum Recursive {
    First(Recursive),
    Second(Recursive),
}
```

这是典型的[动态大小类型](https://course.rs/advance/into-types/sized.html#动态大小类型-dst)，它的大小会无限增长，因此编译器会直接报错:

```shell
error[E0733]: recursion in an `async fn` requires boxing
 --> src/lib.rs:1:22
  |
1 | async fn recursive() {
  |                      ^ an `async fn` cannot invoke itself directly
  |
  = note: a recursive `async fn` must be rewritten to return a boxed future.
```

如果认真学过之前的章节，大家应该知道只要将其使用 `Box` 放到堆上而不是栈上，就可以解决，在这里还是要称赞下 Rust 的编译器，给出的提示总是这么精确```recursion in an `async fn` requires boxing```。

就算是使用 `Box`，这里也大有讲究。如果我们试图使用 `Box::pin` 这种方式去包裹是不行的，因为编译器自身的限制限制了我们(刚夸过它。。。)。为了解决这种问题，我们只能将 `recursive` 转变成一个正常的函数，该函数返回一个使用 `Box` 包裹的 `async` 语句块：

```rust
use futures::future::{BoxFuture, FutureExt};

fn recursive() -> BoxFuture<'static, ()> {
    async move {
        recursive().await;
        recursive().await;
    }.boxed()
}
```

## 在特征中使用 async

在目前版本中，我们还无法在特征中定义 `async fn` 函数，不过大家也不用担心，目前已经有计划在未来移除这个限制了。

```rust
trait Test {
    async fn test();
}
```

运行后报错:

```shell
error[E0706]: functions in traits cannot be declared `async`
 --> src/main.rs:5:5
  |
5 |     async fn test();
  |     -----^^^^^^^^^^^
  |     |
  |     `async` because of this
  |
  = note: `async` trait functions are not currently supported
  = note: consider using the `async-trait` crate: https://crates.io/crates/async-trait
```

好在编译器给出了提示，让我们使用 [`async-trait`](https://github.com/dtolnay/async-trait) 解决这个问题:

```rust
use async_trait::async_trait;

#[async_trait]
trait Advertisement {
    async fn run(&self);
}

struct Modal;

#[async_trait]
impl Advertisement for Modal {
    async fn run(&self) {
        self.render_fullscreen().await;
        for _ in 0..4u16 {
            remind_user_to_join_mailing_list().await;
        }
        self.hide_for_now().await;
    }
}

struct AutoplayingVideo {
    media_url: String,
}

#[async_trait]
impl Advertisement for AutoplayingVideo {
    async fn run(&self) {
        let stream = connect(&self.media_url).await;
        stream.play().await;

        // 用视频说服用户加入我们的邮件列表
        Modal.run().await;
    }
}
```

不过使用该包并不是免费的，每一次特征中的`async`函数被调用时，都会产生一次堆内存分配。对于大多数场景，这个性能开销都可以接受，但是当函数一秒调用几十万、几百万次时，就得小心这块儿代码的性能了！



# 一个实践项目: Web 服务器

知识学得再多，不实际应用也是纸上谈兵，不是忘掉就是废掉，对于技术学习尤为如此。在之前章节中，我们已经学习了 `Async Rust` 的方方面面，现在来将这些知识融会贯通，最终实现一个并发 Web 服务器。

## 多线程版本的 Web 服务器

在正式开始前，先来看一个单线程版本的 `Web` 服务器，该例子来源于 [`Rust Book`](https://doc.rust-lang.org/book/ch20-01-single-threaded.html) 一书。

`src/main.rs`:

```rust
use std::fs;
use std::io::prelude::*;
use std::net::TcpListener;
use std::net::TcpStream;

fn main() {
    // 监听本地端口 7878 ，等待 TCP 连接的建立
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    // 阻塞等待请求的进入
    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    // 从连接中顺序读取 1024 字节数据
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();

    let get = b"GET / HTTP/1.1\r\n";


    // 处理HTTP协议头，若不符合则返回404和对应的`html`文件
    let (status_line, filename) = if buffer.starts_with(get) {
        ("HTTP/1.1 200 OK\r\n\r\n", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND\r\n\r\n", "404.html")
    };
    let contents = fs::read_to_string(filename).unwrap();

    // 将回复内容写入连接缓存中
    let response = format!("{status_line}{contents}");
    stream.write_all(response.as_bytes()).unwrap();
    // 使用flush将缓存中的内容发送到客户端
    stream.flush().unwrap();
}
```

`hello.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Hello!</h1>
    <p>Hi from Rust</p>
  </body>
</html>
```

`404.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Oops!</h1>
    <p>Sorry, I don't know what you're asking for.</p>
  </body>
</html>
```

运行以上代码，并从浏览器访问 `127.0.0.1:7878` 你将看到一条来自 `Ferris` 的问候。

在回忆了单线程版本该如何实现后，我们也将进入正题，一起来实现一个基于 `async` 的异步 Web 服务器。

## 运行异步代码

一个 Web 服务器必须要能并发的处理大量来自用户的请求，也就是我们不能在处理完上一个用户的请求后，再处理下一个用户的请求。上面的单线程版本可以修改为多线程甚至于线程池来实现并发处理，但是线程还是太重了，使用 `async` 实现 `Web` 服务器才是最适合的。

首先将 `handle_connection` 修改为 `async` 实现:

```rust
async fn handle_connection(mut stream: TcpStream) {
    //<-- snip -->
}
```

该修改会将函数的返回值从 `()` 变成 `Future<Output=()>` ，因此直接运行将不再有任何效果，只用通过`.await`或执行器的`poll`调用后才能获取 `Future` 的结果。

在之前的代码中，我们使用了自己实现的简单的执行器来进行`.await` 或 `poll` ，实际上这只是为了学习原理，**在实际项目中，需要选择一个三方的 `async` 运行时来实现相关的功能**。 具体的选择我们将在下一章节进行讲解，现在先选择 `async-std` ，该包的最大优点就是跟标准库的 API 类似，相对来说更简单易用。

#### 使用 async-std 作为异步运行时

下面的例子将演示如何使用一个异步运行时`async-std`来让之前的 `async fn` 函数运行起来，该运行时允许使用属性 `#[async_std::main]` 将我们的 `fn main` 函数变成 `async fn main` ，这样就可以在 `main` 函数中直接调用其它 `async` 函数，否则你得用之前章节的 `block_on` 方法来让 `main` 去阻塞等待异步函数的完成，但是这种简单粗暴的阻塞等待方式并不灵活。

修改 `Cargo.toml` 添加 `async-std` 包并开启相应的属性:

```toml
[dependencies]
futures = "0.3"

[dependencies.async-std]
version = "1.6"
features = ["attributes"]
```

下面将 `main` 函数修改为异步的，并在其中调用前面修改的异步版本 `handle_connection` :

```rust
#[async_std::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    for stream in listener.incoming() {
        let stream = stream.unwrap();
        // 警告，这里无法并发
        handle_connection(stream).await;
    }
}
```

**上面的代码虽然已经是异步的，实际上它还无法并发**，原因我们后面会解释，先来模拟一下慢请求:

```rust
use async_std::task;

async fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();

    let get = b"GET / HTTP/1.1\r\n";
    let sleep = b"GET /sleep HTTP/1.1\r\n";

    let (status_line, filename) = if buffer.starts_with(get) {
        ("HTTP/1.1 200 OK\r\n\r\n", "hello.html")
    } else if buffer.starts_with(sleep) {
        task::sleep(Duration::from_secs(5)).await;
        ("HTTP/1.1 200 OK\r\n\r\n", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND\r\n\r\n", "404.html")
    };
    let contents = fs::read_to_string(filename).unwrap();

    let response = format!("{status_line}{contents}");
    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}
```

上面是全新实现的 `handle_connection` ，它会在内部睡眠 5 秒，模拟一次用户慢请求，需要注意的是，我们并没有使用 `std::thread::sleep` 进行睡眠，原因是该函数是阻塞的，它会让当前线程陷入睡眠中，导致其它任务无法继续运行！因此我们需要一个睡眠函数 `async_std::task::sleep`，它仅会让当前的任务陷入睡眠，然后该任务会让出线程的控制权，这样线程就可以继续运行其它任务。

因此，光把函数变成 `async` 往往是不够的，还需要将它内部的代码也都变成异步兼容的，阻塞线程绝对是不可行的。

现在运行服务器，并访问 `127.0.0.1:7878/sleep`， 你会发现只有在完成第一个用户请求(5 秒后)，才能开始处理第二个用户请求。现在再来看看该如何解决这个问题，让请求并发起来。

## 并发地处理连接

上面代码最大的问题是 `listener.incoming()` 是阻塞的迭代器。当 `listener` 在等待连接时，执行器是无法执行其它`Future`的，而且只有在我们处理完已有的连接后，才能接收新的连接。

解决方法是将 `listener.incoming()` 从一个阻塞的迭代器变成一个非阻塞的 `Stream`， 后者在前面章节有过专门介绍：

```rust
use async_std::net::TcpListener;
use async_std::net::TcpStream;
use futures::stream::StreamExt;

#[async_std::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").await.unwrap();
    listener
        .incoming()
        .for_each_concurrent(/* limit */ None, |tcpstream| async move {
            let tcpstream = tcpstream.unwrap();
            handle_connection(tcpstream).await;
        })
        .await;
}
```

异步版本的 `TcpListener` 为 `listener.incoming()` 实现了 `Stream` 特征，以上修改有两个好处:

- `listener.incoming()` 不再阻塞
- 使用 `for_each_concurrent` 并发地处理从 `Stream` 获取的元素

现在上面的实现的关键在于 `handle_connection` 不能再阻塞:

```rust
use async_std::prelude::*;

async fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).await.unwrap();

    //<-- snip -->
    stream.write(response.as_bytes()).await.unwrap();
    stream.flush().await.unwrap();
}
```

在将数据读写改造成异步后，现在该函数也彻底变成了异步的版本，因此一次慢请求不再会阻止其它请求的运行。

## 使用多线程并行处理请求

聪明的读者不知道有没有发现，之前的例子有一个致命的缺陷：只能使用一个线程并发的处理用户请求。是的，这样也可以实现并发，一秒处理几千次请求问题不大，但是这毕竟没有利用上 CPU 的多核并行能力，无法实现性能最大化。

`async` 并发和多线程其实并不冲突，而 `async-std` 包也允许我们使用多个线程去处理，由于 `handle_connection` 实现了 `Send` 特征且不会阻塞，因此使用 `async_std::task::spawn` 是非常安全的:

```rust
use async_std::task::spawn;

#[async_std::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").await.unwrap();
    listener
        .incoming()
        .for_each_concurrent(/* limit */ None, |stream| async move {
            let stream = stream.unwrap();
            spawn(handle_connection(stream));
        })
        .await;
}
```

至此，我们实现了同时使用并行(多线程)和并发( `async` )来同时处理多个请求！

## 测试 handle_connection 函数

对于测试 Web 服务器，使用集成测试往往是最简单的，但是在本例子中，将使用单元测试来测试连接处理函数的正确性。

为了保证单元测试的隔离性和确定性，我们使用 `MockTcpStream` 来替代 `TcpStream` 。首先，修改 `handle_connection` 的函数签名让测试更简单，之所以可以修改签名，原因在于 `async_std::net::TcpStream` 实际上并不是必须的，只要任何结构体实现了 `async_std::io::Read`, `async_std::io::Write` 和 `marker::Unpin` 就可以替代它：

```rust
use std::marker::Unpin;
use async_std::io::{Read, Write};

async fn handle_connection(mut stream: impl Read + Write + Unpin) {
```

下面，来构建一个 mock 的 `TcpStream` 并实现了上面这些特征，它包含一些数据，这些数据将被拷贝到 `read` 缓存中, 然后返回 `Poll::Ready` 说明 `read` 已经结束：

```rust
use super::*;
use futures::io::Error;
use futures::task::{Context, Poll};

use std::cmp::min;
use std::pin::Pin;

struct MockTcpStream {
    read_data: Vec<u8>,
    write_data: Vec<u8>,
}

impl Read for MockTcpStream {
    fn poll_read(
        self: Pin<&mut Self>,
        _: &mut Context,
        buf: &mut [u8],
    ) -> Poll<Result<usize, Error>> {
        let size: usize = min(self.read_data.len(), buf.len());
        buf[..size].copy_from_slice(&self.read_data[..size]);
        Poll::Ready(Ok(size))
    }
}
```

`Write`的实现也类似，需要实现三个方法 : `poll_write`, `poll_flush`, 与 `poll_close`。 `poll_write` 会拷贝输入数据到 mock 的 `TcpStream` 中，当完成后返回 `Poll::Ready`。由于 `TcpStream` 无需 `flush` 和 `close`，因此另两个方法直接返回 `Poll::Ready` 即可。

```rust
impl Write for MockTcpStream {
    fn poll_write(
        mut self: Pin<&mut Self>,
        _: &mut Context,
        buf: &[u8],
    ) -> Poll<Result<usize, Error>> {
        self.write_data = Vec::from(buf);

        Poll::Ready(Ok(buf.len()))
    }

    fn poll_flush(self: Pin<&mut Self>, _: &mut Context) -> Poll<Result<(), Error>> {
        Poll::Ready(Ok(()))
    }

    fn poll_close(self: Pin<&mut Self>, _: &mut Context) -> Poll<Result<(), Error>> {
        Poll::Ready(Ok(()))
    }
}
```

最后，我们的 mock 需要实现 `Unpin` 特征，表示它可以在内存中安全的移动，具体内容在[前面章节](https://course.rs/async-rust/async/pin-unpin.html)有讲。

```rust
use std::marker::Unpin;
impl Unpin for MockTcpStream {}
```

现在可以准备开始测试了，在使用初始化数据设置好 `MockTcpStream` 后，我们可以使用 `#[async_std::test]` 来运行 `handle_connection` 函数，该函数跟 `#[async_std::main]` 的作用类似。为了确保 `handle_connection` 函数正确工作，需要根据初始化数据检查正确的数据被写入到 `MockTcpStream` 中。

```rust
use std::fs;

#[async_std::test]
async fn test_handle_connection() {
    let input_bytes = b"GET / HTTP/1.1\r\n";
    let mut contents = vec![0u8; 1024];
    contents[..input_bytes.len()].clone_from_slice(input_bytes);
    let mut stream = MockTcpStream {
        read_data: contents,
        write_data: Vec::new(),
    };

    handle_connection(&mut stream).await;
    let mut buf = [0u8; 1024];
    stream.read(&mut buf).await.unwrap();

    let expected_contents = fs::read_to_string("hello.html").unwrap();
    let expected_response = format!("HTTP/1.1 200 OK\r\n\r\n{}", expected_contents);
    assert!(stream.write_data.starts_with(expected_response.as_bytes()));
}
```





# **Tokio 使用指南**



在上一个章节中，我们提到了 Rust 异步编程的限制，其中之一就是你必须引入社区提供的异步运行时，其中最有名的就是 `tokio`。



在本章中，我们一起来看看 `tokio` 到底有什么优势，以及该如何使用它。



\> 本章在内容上大量借鉴和翻译了 tokio 官方文档[Tokio Tutorial](https://tokio.rs/tokio/tutorial), 但是重新组织了内容形式并融入了很多自己的见解和感悟，给大家提供更好的可读性和知识扩展性

# tokio 概览

对于 Async Rust，最最重要的莫过于底层的异步运行时，它提供了执行器、任务调度、异步 API 等核心服务。简单来说，使用 Rust 提供的 `async/await` 特性编写的异步代码要运行起来，就必须依赖于异步运行时，否则这些代码将毫无用处。

## 异步运行时

Rust 语言本身只提供了异步编程所需的基本特性，例如 `async/await` 关键字，标准库中的 `Future` 特征，官方提供的 `futures` 实用库，这些特性单独使用没有任何用处，因此我们需要一个运行时来将这些特性实现的代码运行起来。

异步运行时是由 Rust 社区提供的，它们的核心是一个 `reactor` 和一个或多个 `executor`(执行器):

- `reactor` 用于提供外部事件的订阅机制，例如 `I/O` 、进程间通信、定时器等
- `executor` 在上一章我们有过深入介绍，它用于调度和执行相应的任务( `Future` )

目前最受欢迎的几个运行时有:

- [`tokio`](https://github.com/tokio-rs/tokio)，目前最受欢迎的异步运行时，功能强大，还提供了异步所需的各种工具(例如 tracing )、网络协议框架(例如 HTTP，gRPC )等等
- [`async-std`](https://github.com/async-rs/async-std)，最大的优点就是跟标准库兼容性较强
- [`smol`](https://github.com/smol-rs/smol), 一个小巧的异步运行时

但是，大浪淘沙，留下的才是金子，随着时间的流逝，`tokio`越来越亮眼，无论是性能、功能还是社区、文档，它在各个方面都异常优秀，时至今日，可以说已成为事实上的标准。

#### 异步运行时的兼容性

为何选择异步运行时这么重要？不仅仅是它们在功能、性能上存在区别，更重要的是当你选择了一个，往往就无法切换到另外一个，除非异步代码很少。

使用异步运行时，往往伴随着对它相关的生态系统的深入使用，因此耦合性会越来越强，直至最后你很难切换到另一个运行时，例如 `tokio` 和 `async-std` ，就存在这种问题。

如果你实在有这种需求，可以考虑使用 [`async-compat`](https://github.com/smol-rs/async-compat)，该包提供了一个中间层，用于兼容 `tokio` 和其它运行时。

#### 结论

相信大家看到现在，心中应该有一个结论了。首先，运行时之间的不兼容性，让我们必须提前选择一个运行时，并且在未来坚持用下去，那这个运行时就应该是最优秀、最成熟的那个，`tokio` 几乎成了不二选择，当然 `tokio` 也有自己的问题：更难上手和运行时之间的兼容性。

如果你只用 `tokio` ，那兼容性自然不是问题，至于难以上手，Rust 这么难，我们都学到现在了，何况区区一个异步运行时，在本书的帮助下，这些都不再是问题：）

## tokio 简介

tokio 是一个纸醉金迷之地，只要有钱就可以为所欲为，哦，抱歉，走错片场了。`tokio` 是 Rust 最优秀的异步运行时框架，它提供了写异步网络服务所需的几乎所有功能，不仅仅适用于大型服务器，还适用于小型嵌入式设备，它主要由以下组件构成：

- 多线程版本的异步运行时，可以运行使用 `async/await` 编写的代码
- 标准库中阻塞 API 的异步版本，例如`thread::sleep`会阻塞当前线程，`tokio`中就提供了相应的异步实现版本
- 构建异步编程所需的生态，甚至还提供了 [`tracing`](https://github.com/tokio-rs/tracing) 用于日志和分布式追踪， 提供 [`console`](https://github.com/tokio-rs/console) 用于 Debug 异步编程

### 优势

下面一起来看看使用 `tokio` 能给你提供哪些优势。

**高性能**

因为快所以快，前者是 Rust 快，后者是 `tokio` 快。 `tokio` 在编写时充分利用了 Rust 提供的各种零成本抽象和高性能特性，而且贯彻了 Rust 的牛逼思想：如果你选择手写代码，那么最好的结果就是跟 `tokio` 一样快！

以下是一张官方提供的性能参考图，大致能体现出 `tokio` 的性能之恐怖:
<img alt="tokio performance" src="https://pica.zhimg.com/80/v2-5f5ca10550ec936427c2919191331ae8_1440w.png" class="center"  />

**高可靠**

Rust 语言的安全可靠性顺理成章的影响了 `tokio` 的可靠性，曾经有一个调查给出了令人乍舌的[结论](https://www.zdnet.com/article/microsoft-70-percent-of-all-security-bugs-are-memory-safety-issues/)：软件系统 70%的高危漏洞都是由内存不安全性导致的。

在 Rust 提供的安全性之外，`tokio` 还致力于提供一致性的行为表现：无论你何时运行系统，它的预期表现和性能都是一致的，例如不会出现莫名其妙的请求延迟或响应时间大幅增加。

**简单易用**

通过 Rust 提供的 `async/await` 特性，编写异步程序的复杂性相比当初已经大幅降低，同时 `tokio` 还为我们提供了丰富的生态，进一步大幅降低了其复杂性。

同时 `tokio` 遵循了标准库的命名规则，让熟悉标准库的用户可以很快习惯于 `tokio` 的语法，再借助于 Rust 强大的类型系统，用户可以轻松地编写和交付正确的代码。

**使用灵活性**

`tokio` 支持你灵活的定制自己想要的运行时，例如你可以选择多线程 + 任务盗取模式的复杂运行时，也可以选择单线程的轻量级运行时。总之，几乎你的每一种需求在 `tokio` 中都能寻找到支持(画外音：强大的灵活性需要一定的复杂性来换取，并不是免费的午餐)。

### 劣势

虽然 `tokio` 对于大多数需要并发的项目都是非常适合的，但是确实有一些场景它并不适合使用:

- **并行运行 CPU 密集型的任务**。`tokio` 非常适合于 IO 密集型任务，这些 IO 任务的绝大多数时间都用于阻塞等待 IO 的结果，而不是刷刷刷的单烤 CPU。如果你的应用是 CPU 密集型(例如并行计算)，建议使用 [`rayon`](https://github.com/rayon-rs/rayon)，当然，对于其中的 IO 任务部分，你依然可以混用 `tokio`
- **读取大量的文件**。读取文件的瓶颈主要在于操作系统，因为 OS 没有提供异步文件读取接口，大量的并发并不会提升文件读取的并行性能，反而可能会造成不可忽视的性能损耗，因此建议使用线程(或线程池)的方式
- **发送少量 HTTP 请求**。`tokio` 的优势是给予你并发处理大量任务的能力，对于这种轻量级 HTTP 请求场景，`tokio` 除了增加你的代码复杂性，并无法带来什么额外的优势。因此，对于这种场景，你可以使用 [`reqwest`](https://github.com/seanmonstar/reqwest) 库，它会更加简单易用。


> 若大家使用 tokio，那 CPU 密集的任务尤其需要用线程的方式去处理，例如使用 `spawn_blocking` 创建一个阻塞的线程取完成相应 CPU 密集任务。
>
> 原因是：tokio 是协作式的调度器，如果某个 CPU 密集的异步任务是通过 tokio 创建的，那理论上来说，该异步任务需要跟其它的异步任务交错执行，最终大家都得到了执行，皆大欢喜。但实际情况是，CPU 密集的任务很可能会一直霸着着 CPU，此时 tokio 的调度方式决定了该任务会一直被执行，这意味着，其它的异步任务无法得到执行的机会，最终这些任务都会因为得不到资源而饿死。
>
> 而使用 `spawn_blocking` 后，会创建一个单独的 OS 线程，该线程并不会被 tokio 所调度( 被 OS 所调度 )，因此它所执行的 CPU 密集任务也不会导致 tokio 调度的那些异步任务被饿死


## 总结

离开三方开源社区提供的异步运行时， `async/await` 什么都不是，甚至还不如一堆破铜烂铁，除非你选择根据自己的需求手撸一个。

而 `tokio` 就是那颗皇冠上的夜明珠，也是值得我们投入时间去深入学习的开源库，它的设计原理和代码实现都异常优秀，在之后的章节中，我们将对其进行深入学习和剖析，敬请期待。



# tokio 初印象

又到了喜闻乐见的初印象环节，这个环节决定了你心中的那 24 盏灯最终是全亮还是全灭。

在本文中，我们将看看本专题的学习目标、`tokio`该怎么引入以及如何实现一个 `Hello Tokio` 项目，最终亮灯还是灭灯的决定权留给各位看官。但我提前说好，如果你全灭了，但却找不到更好的，未来还是得回来真香 :P

## 专题目标

通过 API 学项目无疑是无聊的，因此我们采用一个与众不同的方式：边学边练，在本专题的最后你将拥有一个 `redis` 客户端和服务端，当然不会实现一个完整版本的 `redis` ，只会提供基本的功能和部分常用的命令。

#### mini-redis

`redis` 的项目源码可以在[这里访问](https://github.com/sunface/rust-by-practice/tree/master/zh-CN/assets/mini-redis)，本项目是从[官方地址](https://github.com/tokio-rs/mini-redis) `fork` 而来，在未来会提供注释和文档汉化。

再次声明：该项目仅仅用于学习目的，因此它的文档注释非常全，但是它完全无法作为 `redis` 的替代品。

## 环境配置

首先，我们假定你已经安装了 Rust 和相关的工具链，例如 `cargo`。其中 Rust 版本的最低要求是 `1.45.0`，建议使用最新版 `1.58`:

```shell
sunfei@sunface $ rustc --version
rustc 1.58.0 (02072b482 2022-01-11)
```

接下来，安装 `mini-redis` 的服务器端，它可以用来测试我们后面将要实现的 `redis` 客户端：

```shell
$ cargo install mini-redis
```

> 如果下载失败，也可以通过[这个地址](https://github.com/sunface/rust-by-practice/tree/master/zh-CN/assets/mini-redis)下载源码，然后在本地通过 `cargo run`运行。

下载成功后，启动服务端:

```shell
$ mini-redis-server
```

然后，再使用客户端测试下刚启动的服务端:

```shell
$ mini-redis-cli set foo 1
OK
$ mini-redis-cli get foo
"1"
```

不得不说，还挺好用的，先自我陶醉下 :) 此时，万事俱备，只欠东风，接下来是时候亮"箭"了：实现我们的 `Hello Tokio` 项目。

## Hello Tokio

与简单无比的 `Hello World` 有所不同(简单？还记得本书开头时，湖畔边的那个多国语言版本的`你好，世界`嘛~~)，`Hello Tokio` 它承载着"非常艰巨"的任务，那就是向刚启动的 `redis` 服务器写入一个 `key=hello, value=world` ，然后再读取出来，嗯，使用 `mini-redis` 客户端 :)

#### 分析未到，代码先行

在详细讲解之前，我们先来看看完整的代码，让大家有一个直观的印象。首先，创建一个新的 `Rust` 项目:

```shell
$ cargo new my-redis
$ cd my-redis
```

然后在 `Cargo.toml` 中添加相关的依赖:

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
mini-redis = "0.4"
```

接下来，使用以下代码替换 `main.rs` 中的内容：

```rust
use mini_redis::{client, Result};

#[tokio::main]
async fn main() -> Result<()> {
    // 建立与mini-redis服务器的连接
    let mut client = client::connect("127.0.0.1:6379").await?;

    // 设置 key: "hello" 和 值: "world"
    client.set("hello", "world".into()).await?;

    // 获取"key=hello"的值
    let result = client.get("hello").await?;

    println!("从服务器端获取到结果={:?}", result);

    Ok(())
}
```

不知道你之前启动的 `mini-redis-server` 关闭没有，如果关了，记得重新启动下，否则我们的代码就是意大利空气炮。

最后，运行这个项目:

```shell
$ cargo run
从服务器端获取到结果=Some("world")
```

Perfect, 代码成功运行，是时候来解释下其中蕴藏的至高奥秘了。

## 原理解释

代码篇幅虽然不长，但是还是有不少值得关注的地方，接下来我们一起来看看。

```rust
let mut client = client::connect("127.0.0.1:6379").await?;
```

[`client::connect`](https://docs.rs/mini-redis/0.4.1/mini_redis/client/fn.connect.html) 函数由`mini-redis` 包提供，它使用异步的方式跟指定的远程 `IP` 地址建立 TCP 长连接，一旦连接建立成功，那 `client` 的赋值初始化也将完成。

特别值得注意的是：虽然该连接是异步建立的，但是从代码本身来看，完全是**同步的代码编写方式**，唯一能说明异步的点就是 `.await`。

#### 什么是异步编程

大部分计算机程序都是按照代码编写的顺序来执行的：先执行第一行，然后第二行，以此类推(当然，还要考虑流程控制，例如循环)。当进行同步编程时，一旦程序遇到一个操作无法被立即完成，它就会进入阻塞状态，直到该操作完成为止。

因此同步编程非常符合我们人类的思维习惯，是一个顺其自然的过程，被几乎每一个程序员所喜欢(本来想说所有，但我不敢打包票，毕竟总有特立独行之士)。例如，当建立 TCP 连接时，当前线程会被阻塞，直到等待该连接建立完成，然后才往下继续进行。

而使用异步编程，无法立即完成的操作会被切到后台去等待，因此当前线程不会被阻塞，它会接着执行其它的操作。一旦之前的操作准备好可以继续执行后，它会通知执行器，然后执行器会调度它并从上次离开的点继续执行。但是大家想象下，如果没有使用 `await`，而是按照这个异步的流程使用通知 -> 回调的方式实现，代码该多么的难写和难读！

好在 Rust 为我们提供了 `async/await` 的异步编程特性，让我们可以像写同步代码那样去写异步的代码，也让这个世界美好依旧。

#### 编译时绿色线程

一个函数可以通过`async fn`的方式被标记为异步函数:

```rust
use mini_redis::Result;
use mini_redis::client::Client;
use tokio::net::ToSocketAddrs;

pub async fn connect<T: ToSocketAddrs>(addr: T) -> Result<Client> {
    // ...
}
```

在上例中，`redis` 的连接函数 `connect` 实现如上，它看上去很像是一个同步函数，但是 `async fn` 出卖了它。
`async fn` 异步函数并不会直接返回值，而是返回一个 `Future`，顾名思义，该 `Future` 会在未来某个时间点被执行，然后最终获取到真实的返回值 `Result<Client>`。

> async/await 的原理就算大家不理解，也不妨碍使用 `tokio` 写出能用的服务，但是如果想要更深入的用好，强烈建议认真读下本书的 [`async/await` 异步编程章节](https://course.rs/async/intro.html)，你会对 Rust 的异步编程有一个全新且深刻的认识。

由于 `async` 会返回一个 `Future`，因此我们还需要配合使用 `.await` 来让该 `Future` 运行起来，最终获得返回值:

```rust
async fn say_to_world() -> String {
    String::from("world")
}

#[tokio::main]
async fn main() {
    // 此处的函数调用是惰性的，并不会执行 `say_to_world()` 函数体中的代码
    let op = say_to_world();

    // 首先打印出 "hello"
    println!("hello");

    // 使用 `.await` 让 `say_to_world` 开始运行起来
    println!("{}", op.await);
}
```

上面代码输出如下:

```shell
hello
world
```

而大家可能很好奇 `async fn` 到底返回什么吧？它实际上返回的是一个实现了 `Future` 特征的匿名类型: `impl Future<Output = String>`。

#### async main

在代码中，使用了一个与众不同的 `main` 函数 : `async fn main` ，而且是用 `#[tokio::main]` 属性进行了标记。异步 `main` 函数有以下意义：

- `.await` 只能在 `async` 函数中使用，如果是以前的 `fn main`，那它内部是无法直接使用 `async` 函数的！这个会极大的限制了我们的使用场景
- 异步运行时本身需要初始化

因此 `#[tokio::main]` 宏在将 `async fn main` 隐式的转换为 `fn main` 的同时还对整个异步运行时进行了初始化。例如以下代码:

```rust
#[tokio::main]
async fn main() {
    println!("hello");
}
```

将被转换成:

```rust
fn main() {
    let mut rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        println!("hello");
    })
}
```

最终，Rust 编译器就愉快地执行这段代码了。

## cargo feature

在引入 `tokio` 包时，我们在 `Cargo.toml` 文件中添加了这么一行:

```toml
tokio = { version = "1", features = ["full"] }
```

里面有个 `features = ["full"]` 可能大家会比较迷惑，当然，关于它的具体解释在本书的 [Cargo 详解专题](https://course.rs/cargo/intro.html) 有介绍，这里就简单进行说明。

`Tokio` 有很多功能和特性，例如 `TCP`，`UDP`，`Unix sockets`，同步工具，多调度类型等等，不是每个应用都需要所有的这些特性。为了优化编译时间和最终生成可执行文件大小、内存占用大小，应用可以对这些特性进行可选引入。

而这里为了演示的方便，我们使用 `full` ，表示直接引入所有的特性。

## 总结

大家对 `tokio` 的初印象如何？可否 24 灯全亮通过？

总之，`tokio` 做的事情其实是细雨润无声的，在大多数时候，我们并不能感觉到它的存在，但是它确实是异步编程中最重要的一环(或者之一)，深入了解它对我们的未来之路会有莫大的帮助。

接下来，正式开始 `tokio` 的学习之旅。



# 创建异步任务

同志们，抓稳了，我们即将换挡提速，通向 `mini-redis` 服务端的高速之路已经开启。

不过在开始之前，先来做点收尾工作：上一章节中，我们实现了一个简易的 `mini-redis` 客户端并支持了 `SET`/`GET` 操作, 现在将该[代码](https://course.rs/tokio/getting-startted.html#分析未到代码先行)移动到 `example` 文件夹下，因为我们这个章节要实现的是服务器，后面可以用之前客户端示例对我们的服务器端进行测试:

```shell
$ mkdir -p examples
$ mv src/main.rs examples/hello-redis.rs
```

然后再重新创建一个空的 `src/main.rs` 文件，至此换挡已经完成，提速正式开始。

## 接收 sockets

作为服务器端，最基础的工作无疑是接收外部进来的 TCP 连接，可以通过 `tokio::net::TcpListener` 来完成。

> Tokio 中大多数类型的名称都和标准库中对应的同步类型名称相同，而且，如果没有特殊原因，Tokio 的 API 名称也和标准库保持一致，只不过用 `async fn` 取代 `fn` 来声明函数。

`TcpListener` 监听 **6379** 端口，然后通过循环来接收外部进来的连接，每个连接在处理完后会被关闭。对于目前来说，我们的任务很简单：读取命令、打印到标准输出 `stdout`，最后回复给客户端一个错误。

```rust
use tokio::net::{TcpListener, TcpStream};
use mini_redis::{Connection, Frame};

#[tokio::main]
async fn main() {
    // Bind the listener to the address
    // 监听指定地址，等待 TCP 连接进来
    let listener = TcpListener::bind("127.0.0.1:6379").await.unwrap();

    loop {
        // 第二个被忽略的项中包含有新连接的 `IP` 和端口信息
        let (socket, _) = listener.accept().await.unwrap();
        process(socket).await;
    }
}

async fn process(socket: TcpStream) {
    // `Connection` 对于 redis 的读写进行了抽象封装，因此我们读到的是一个一个数据帧frame(数据帧 = redis命令 + 数据)，而不是字节流
    // `Connection` 是在 mini-redis 中定义
    let mut connection = Connection::new(socket);

    if let Some(frame) = connection.read_frame().await.unwrap() {
        println!("GOT: {:?}", frame);

        // 回复一个错误
        let response = Frame::Error("unimplemented".to_string());
        connection.write_frame(&response).await.unwrap();
    }
}
```

现在运行我们的简单服务器 :

```shel
cargo run
```

此时服务器会处于循环等待以接收连接的状态，接下来在一个新的终端窗口中启动上一章节中的 `redis` 客户端，由于相关代码已经放入 `examples` 文件夹下，因此我们可以使用 `-- example` 来指定运行该客户端示例:

```shell
$ cargo run --example hello-redis
```

此时，客户端的输出是: `Error: "unimplemented"`, 同时服务器端打印出了客户端发来的由 **redis 命令和数据** 组成的数据帧: `GOT: Array([Bulk(b"set"), Bulk(b"hello"), Bulk(b"world")])`。

## 生成任务

上面的服务器，如果你仔细看，它其实一次只能接受和处理一条 TCP 连接，只有等当前的处理完并结束后，才能开始接收下一条连接。原因在于 `loop` 循环中的 `await` 会导致当前任务进入阻塞等待，也就是 `loop` 循环会被阻塞。

而这显然不是我们想要的，服务器能并发地处理多条连接的请求，才是正确的打开姿势，下面来看看如何实现真正的并发。

> 关于并发和并行，在[多线程章节中](https://course.rs/advance/concurrency-with-threads/concurrency-parallelism.html)有详细的解释

为了并发的处理连接，需要为每一条进来的连接都生成( `spawn` )一个新的任务, 然后在该任务中处理连接:

```rust
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:6379").await.unwrap();

    loop {
        let (socket, _) = listener.accept().await.unwrap();
        // 为每一条连接都生成一个新的任务，
        // `socket` 的所有权将被移动到新的任务中，并在那里进行处理
        tokio::spawn(async move {
            process(socket).await;
        });
    }
}
```

#### 任务

一个 Tokio 任务是一个异步的绿色线程，它们通过 `tokio::spawn` 进行创建，该函数会返回一个 `JoinHandle` 类型的句柄，调用者可以使用该句柄跟创建的任务进行交互。

`spawn` 函数的参数是一个 `async` 语句块，该语句块甚至可以返回一个值，然后调用者可以通过 `JoinHandle` 句柄获取该值:

```rust
#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
       10086
    });

    let out = handle.await.unwrap();
    println!("GOT {}", out);
}
```

以上代码会打印出`GOT 10086`。实际上，上面代码中`.await` 会返回一个 `Result` ，若 `spawn` 创建的任务正常运行结束，则返回一个 `Ok(T)`的值，否则会返回一个错误 `Err`：例如任务内部发生了 `panic` 或任务因为运行时关闭被强制取消时。

任务是调度器管理的执行单元。`spawn`生成的任务会首先提交给调度器，然后由它负责调度执行。需要注意的是，执行任务的线程未必是创建任务的线程，任务完全有可能运行在另一个不同的线程上，而且任务在生成后，它还可能会在线程间被移动。

任务在 Tokio 中远比看上去要更轻量，例如创建一个任务仅仅需要一次 64 字节大小的内存分配。因此应用程序在生成任务上，完全不应该有任何心理负担，除非你在一台没那么好的机器上疯狂生成了几百万个任务。。。

#### `'static` 约束

当使用 Tokio 创建一个任务时，该任务类型的生命周期必须是 `'static`。意味着，在任务中不能使用外部数据的引用:

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    let v = vec![1, 2, 3];

    task::spawn(async {
        println!("Here's a vec: {:?}", v);
    });
}
```

上面代码中，`spawn` 出的任务引用了外部环境中的变量 `v` ，导致以下报错:

```console
error[E0373]: async block may outlive the current function, but
              it borrows `v`, which is owned by the current function
 --> src/main.rs:7:23
  |
7 |       task::spawn(async {
  |  _______________________^
8 | |         println!("Here's a vec: {:?}", v);
  | |                                        - `v` is borrowed here
9 | |     });
  | |_____^ may outlive borrowed value `v`
  |
note: function requires argument type to outlive `'static`
 --> src/main.rs:7:17
  |
7 |       task::spawn(async {
  |  _________________^
8 | |         println!("Here's a vector: {:?}", v);
9 | |     });
  | |_____^
help: to force the async block to take ownership of `v` (and any other
      referenced variables), use the `move` keyword
  |
7 |     task::spawn(async move {
8 |         println!("Here's a vec: {:?}", v);
9 |     });
  |
```

原因在于：默认情况下，变量并不是通过 `move` 的方式转移进 `async` 语句块的， `v` 变量的所有权依然属于 `main` 函数，因为任务内部的 `println!` 是通过借用的方式使用了 `v`，但是这种借用并不能满足 `'static` 生命周期的要求。

在报错的同时，Rust 编译器还给出了相当有帮助的提示：为 `async` 语句块使用 `move` 关键字，这样就能将 `v` 的所有权从 `main` 函数转移到新创建的任务中。

但是 `move` 有一个问题，一个数据只能被一个任务使用，如果想要多个任务使用一个数据，就有些强人所难。不知道还有多少同学记得 [`Arc`](https://course.rs/advance/smart-pointer/rc-arc.html)，它可以轻松解决该问题，还是线程安全的。

在上面的报错中，还有一句很奇怪的信息```function requires argument type to outlive `'static` ```， 函数要求参数类型的生命周期必须比 `'static` 长，问题是 `'static` 已经活得跟整个程序一样久了，难道函数的参数还能活得更久？大家可能会觉得编译器秀逗了，毕竟其它语言编译器也有秀逗的时候:)

先别急着给它扣帽子，虽然我有时候也想这么做。。原因是它说的是类型必须活得比 `'static` 长，而不是值。当我们说一个值是 `'static` 时，意味着它将永远存活。这个很重要，因为编译器无法知道新创建的任务将存活多久，所以唯一的办法就是让任务永远存活。

如果大家对于 `'&static` 和 `T: 'static` 较为模糊，强烈建议回顾下[该章节](https://course.rs/advance/lifetime/static.html)。

#### Send 约束

`tokio::spawn` 生成的任务必须实现 `Send` 特征，因为当这些任务在 `.await` 执行过程中发生阻塞时，Tokio 调度器会将任务在线程间移动。

**一个任务要实现 `Send` 特征，那它在 `.await` 调用的过程中所持有的全部数据都必须实现 `Send` 特征**。当 `.await` 调用发生阻塞时，任务会让出当前线程所有权给调度器，然后当任务准备好后，调度器会从上一次暂停的位置继续执行该任务。该流程能正确的工作，任务必须将`.await`之后使用的所有状态保存起来，这样才能在中断后恢复现场并继续执行。若这些状态实现了 `Send` 特征(可以在线程间安全地移动)，那任务自然也就可以在线程间安全地移动。

例如以下代码可以工作:

```rust
use tokio::task::yield_now;
use std::rc::Rc;

#[tokio::main]
async fn main() {
    tokio::spawn(async {
        // 语句块的使用强制了 `rc` 会在 `.await` 被调用前就被释放，
        // 因此 `rc` 并不会影响 `.await`的安全性
        {
            let rc = Rc::new("hello");
            println!("{}", rc);
        }

        // `rc` 的作用范围已经失效，因此当任务让出所有权给当前线程时，它无需作为状态被保存起来
        yield_now().await;
    });
}
```

但是下面代码就不行：

```rust
use tokio::task::yield_now;
use std::rc::Rc;

#[tokio::main]
async fn main() {
    tokio::spawn(async {
        let rc = Rc::new("hello");


        // `rc` 在 `.await` 后还被继续使用，因此它必须被作为任务的状态保存起来
        yield_now().await;


        // 事实上，注释掉下面一行代码，依然会报错
        // 原因是：是否保存，不取决于 `rc` 是否被使用，而是取决于 `.await`在调用时是否仍然处于 `rc` 的作用域中
        println!("{}", rc);

        // rc 作用域在这里结束
    });
}
```

这里有一个很重要的点，代码注释里有讲到，但是我们再重复一次： `rc` 是否会保存到任务状态中，取决于 `.await` 的调用是否处于它的作用域中，上面代码中，就算你注释掉 `println!` 函数，该报错依然会报错，因为 `rc` 的作用域直到 `async` 的末尾才结束！

下面是相应的报错，在下一章节，我们还会继续深入讨论该错误:

```shell
error: future cannot be sent between threads safely
   --> src/main.rs:6:5
    |
6   |     tokio::spawn(async {
    |     ^^^^^^^^^^^^ future created by async block is not `Send`
    |
   ::: [..]spawn.rs:127:21
    |
127 |         T: Future + Send + 'static,
    |                     ---- required by this bound in
    |                          `tokio::task::spawn::spawn`
    |
    = help: within `impl std::future::Future`, the trait
    |       `std::marker::Send` is not  implemented for
    |       `std::rc::Rc<&str>`
note: future is not `Send` as this value is used across an await
   --> src/main.rs:10:9
    |
7   |         let rc = Rc::new("hello");
    |             -- has type `std::rc::Rc<&str>` which is not `Send`
...
10  |         yield_now().await;
    |         ^^^^^^^^^^^^^^^^^ await occurs here, with `rc` maybe
    |                           used later
11  |         println!("{}", rc);
12  |     });
    |     - `rc` is later dropped here
```

## 使用 HashMap 存储数据

现在，我们可以继续前进了，下面来实现 `process` 函数，它用于处理进入的命令。相应的值将被存储在 `HashMap` 中: 通过 `SET` 命令存值，通过 `GET` 命令来取值。

同时，我们将使用循环的方式在同一个客户端连接中处理多次连续的请求:

```rust
use tokio::net::TcpStream;
use mini_redis::{Connection, Frame};

async fn process(socket: TcpStream) {
    use mini_redis::Command::{self, Get, Set};
    use std::collections::HashMap;

    // 使用 hashmap 来存储 redis 的数据
    let mut db = HashMap::new();

    // `mini-redis` 提供的便利函数，使用返回的 `connection` 可以用于从 socket 中读取数据并解析为数据帧
    let mut connection = Connection::new(socket);

    // 使用 `read_frame` 方法从连接获取一个数据帧：一条redis命令 + 相应的数据
    while let Some(frame) = connection.read_frame().await.unwrap() {
        let response = match Command::from_frame(frame).unwrap() {
            Set(cmd) => {
                // 值被存储为 `Vec<u8>` 的形式
                db.insert(cmd.key().to_string(), cmd.value().to_vec());
                Frame::Simple("OK".to_string())
            }
            Get(cmd) => {
                if let Some(value) = db.get(cmd.key()) {
                    // `Frame::Bulk` 期待数据的类型是 `Bytes`， 该类型会在后面章节讲解，
                    // 此时，你只要知道 `&Vec<u8>` 可以使用 `into()` 方法转换成 `Bytes` 类型
                    Frame::Bulk(value.clone().into())
                } else {
                    Frame::Null
                }
            }
            cmd => panic!("unimplemented {:?}", cmd),
        };

        // 将请求响应返回给客户端
        connection.write_frame(&response).await.unwrap();
    }
}

// main 函数在之前已实现
```

使用 `cargo run` 运行服务器，然后再打开另一个终端窗口，运行 `hello-redis` 客户端示例: `cargo run --example hello-redis`。

Bingo，在看了这么多原理后，我们终于迈出了小小的第一步，并获取到了存在 `HashMap` 中的值: `got value from the server; result=Some(b"world")`。

但是问题又来了：这些值无法在 TCP 连接中共享，如果另外一个用户连接上来并试图同时获取 `hello` 这个 `key`，他将一无所获。



# 共享状态

上一章节中，咱们搭建了一个异步的 redis 服务器，并成功的提供了服务，但是其隐藏了一个巨大的问题：状态(数据)无法在多个连接之间共享，下面一起来看看该如何解决。

## 解决方法

好在 Tokio 十分强大，上面问题对应的解决方法也不止一种：

- 使用 `Mutex` 来保护数据的共享访问
- 生成一个异步任务去管理状态，然后各个连接使用消息传递的方式与其进行交互

其中，第一种方法适合比较简单的数据，而第二种方法适用于需要异步工作的，例如 I/O 原语。由于我们使用的数据存储类型是 `HashMap`，使用到的相关操作是 `insert` 和 `get` ，又因为这两个操作都不是异步的，因此只要使用 `Mutex` 即可解决问题。

在上面的描述中，说实话第二种方法及其适用的场景并不是很好理解，但没关系，在后面章节会进行详细介绍。

## 添加 `bytes` 依赖包

在上一节中，我们使用 `Vec<u8>` 来保存目标数据，但是它有一个问题，对它进行克隆时会将底层数据也整个复制一份，效率很低，但是克隆操作对于我们在多连接间共享数据又是必不可少的。

因此这里咱们新引入一个 `bytes` 包，它包含一个 `Bytes` 类型，当对该类型的值进行克隆时，就不再会克隆底层数据。事实上，`Bytes` 是一个引用计数类型，跟 `Arc` 非常类似，或者准确的说，`Bytes` 就是基于 `Arc` 实现的，但相比后者`Bytes` 提供了一些额外的能力。

在 `Cargo.toml` 的 `[dependencies]` 中引入 `bytes` ：

```console
bytes = "1"
```

## 初始化 HashMap

由于 `HashMap` 会在多个任务甚至多个线程间共享，再结合之前的选择，最终我们决定使用 `Arc<Mutex<T>>` 的方式对其进行包裹。

但是，大家先来畅想一下使用它进行包裹后的类型长什么样？ 大概，可能，长这样：`Arc<Mutex<HashMap<String, Bytes>>>`，天哪噜，一不小心，你就遇到了 Rust 的阴暗面：类型大串烧。可以想象，如果要在代码中到处使用这样的类型，可读性会极速下降，因此我们需要一个[类型别名](https://course.rs/advance/custom-type.html#类型别名type-alias)( type alias )来简化下：

```rust
use bytes::Bytes;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

type Db = Arc<Mutex<HashMap<String, Bytes>>>;
```

此时，`Db` 就是一个类型别名，使用它就可以替代那一大串的东东，等下你就能看到功效。

接着，我们需要在 `main` 函数中对 `HashMap` 进行初始化，然后使用 `Arc` 克隆一份它的所有权并将其传入到生成的异步任务中。事实上在 Tokio 中，这里的 `Arc` 被称为 **handle**，或者更宽泛的说，`handle` 在 Tokio 中可以用来访问某个共享状态。

```rust
use tokio::net::TcpListener;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:6379").await.unwrap();

    println!("Listening");

    let db = Arc::new(Mutex::new(HashMap::new()));

    loop {
        let (socket, _) = listener.accept().await.unwrap();
        // 将 handle 克隆一份
        let db = db.clone();

        println!("Accepted");
        tokio::spawn(async move {
            process(socket, db).await;
        });
    }
}
```

#### 为何使用 `std::sync::Mutex`

上面代码还有一点非常重要，那就是我们使用了 `std::sync::Mutex` 来保护 `HashMap`，而不是使用 `tokio::sync::Mutex`。

在使用 Tokio 编写异步代码时，一个常见的错误无条件地使用 `tokio::sync::Mutex` ，而真相是：Tokio 提供的异步锁只应该在跨多个 `.await`调用时使用，而且 Tokio 的 `Mutex` 实际上内部使用的也是 `std::sync::Mutex`。

多补充几句，在异步代码中，关于锁的使用有以下经验之谈：

- 锁如果在多个 `.await` 过程中持有，应该使用 Tokio 提供的锁，原因是 `.await`的过程中锁可能在线程间转移，若使用标准库的同步锁存在死锁的可能性，例如某个任务刚获取完锁，还没使用完就因为 `.await` 让出了当前线程的所有权，结果下个任务又去获取了锁，造成死锁
- 锁竞争不多的情况下，使用 `std::sync::Mutex`
- 锁竞争多，可以考虑使用三方库提供的性能更高的锁，例如 [`parking_lot::Mutex`](https://docs.rs/parking_lot/0.10.2/parking_lot/type.Mutex.html)

## 更新 `process()`

`process()` 函数不再初始化 `HashMap`，取而代之的是它使用了 `HashMap` 的一个 `handle` 作为参数:

```rust
use tokio::net::TcpStream;
use mini_redis::{Connection, Frame};

async fn process(socket: TcpStream, db: Db) {
    use mini_redis::Command::{self, Get, Set};

    let mut connection = Connection::new(socket);

    while let Some(frame) = connection.read_frame().await.unwrap() {
        let response = match Command::from_frame(frame).unwrap() {
            Set(cmd) => {
                let mut db = db.lock().unwrap();
                db.insert(cmd.key().to_string(), cmd.value().clone());
                Frame::Simple("OK".to_string())
            }
            Get(cmd) => {
                let db = db.lock().unwrap();
                if let Some(value) = db.get(cmd.key()) {
                    Frame::Bulk(value.clone())
                } else {
                    Frame::Null
                }
            }
            cmd => panic!("unimplemented {:?}", cmd),
        };

        connection.write_frame(&response).await.unwrap();
    }
}
```

## 任务、线程和锁竞争

当竞争不多的时候，使用阻塞性的锁去保护共享数据是一个正确的选择。当一个锁竞争触发后，当前正在执行任务(请求锁)的线程会被阻塞，并等待锁被前一个使用者释放。这里的关键就是：**锁竞争不仅仅会导致当前的任务被阻塞，还会导致执行任务的线程被阻塞，因此该线程准备执行的其它任务也会因此被阻塞！**

默认情况下，Tokio 调度器使用了多线程模式，此时如果有大量的任务都需要访问同一个锁，那么锁竞争将变得激烈起来。当然，你也可以使用 [**current_thread**](https://docs.rs/tokio/1.15.0/tokio/runtime/index.html#current-thread-scheduler) 运行时设置，在该设置下会使用一个单线程的调度器(执行器)，所有的任务都会创建并执行在当前线程上，因此不再会有锁竞争。

> current_thread 是一个轻量级、单线程的运行时，当任务数不多或连接数不多时是一个很好的选择。例如你想在一个异步客户端库的基础上提供给用户同步的 API 访问时，该模式就很适用

当同步锁的竞争变成一个问题时，使用 Tokio 提供的异步锁几乎并不能帮你解决问题，此时可以考虑如下选项：

- 创建专门的任务并使用消息传递的方式来管理状态
- 将锁进行分片
- 重构代码以避免锁

在我们的例子中，由于每一个 `key` 都是独立的，因此对锁进行分片将成为一个不错的选择:

```rust
type ShardedDb = Arc<Vec<Mutex<HashMap<String, Vec<u8>>>>>;

fn new_sharded_db(num_shards: usize) -> ShardedDb {
    let mut db = Vec::with_capacity(num_shards);
    for _ in 0..num_shards {
        db.push(Mutex::new(HashMap::new()));
    }
    Arc::new(db)
}
```

在这里，我们创建了 N 个不同的存储实例，每个实例都会存储不同的分片数据，例如我们有`a-i`共 9 个不同的 `key`, 可以将存储分成 3 个实例，那么第一个实例可以存储 `a-c`，第二个`d-f`，以此类推。在这种情况下，访问 `b` 时，只需要锁住第一个实例，此时二、三实例依然可以正常访问，因此锁被成功的分片了。

在分片后，使用给定的 key 找到对应的值就变成了两个步骤：首先，使用 `key` 通过特定的算法寻找到对应的分片，然后再使用该 `key` 从分片中查询到值:

```rust
let shard = db[hash(key) % db.len()].lock().unwrap();
shard.insert(key, value);
```

这里我们使用 `hash` 算法来进行分片，但是该算法有个缺陷：分片的数量不能变，一旦变了后，那之前落入分片 1 的`key`很可能将落入到其它分片中，最终全部乱掉。此时你可以考虑[dashmap](https://docs.rs/dashmap)，它提供了更复杂、更精妙的支持分片的`hash map`。

## 在 `.await` 期间持有锁

在某些时候，你可能会不经意写下这种代码:

```rust
use std::sync::{Mutex, MutexGuard};

async fn increment_and_do_stuff(mutex: &Mutex<i32>) {
    let mut lock: MutexGuard<i32> = mutex.lock().unwrap();
    *lock += 1;

    do_something_async().await;
} // 锁在这里超出作用域
```

如果你要 `spawn` 一个任务来执行上面的函数的话，会报错:

```console
error: future cannot be sent between threads safely
   --> src/lib.rs:13:5
    |
13  |     tokio::spawn(async move {
    |     ^^^^^^^^^^^^ future created by async block is not `Send`
    |
   ::: /playground/.cargo/registry/src/github.com-1ecc6299db9ec823/tokio-0.2.21/src/task/spawn.rs:127:21
    |
127 |         T: Future + Send + 'static,
    |                     ---- required by this bound in `tokio::task::spawn::spawn`
    |
    = help: within `impl std::future::Future`, the trait `std::marker::Send` is not implemented for `std::sync::MutexGuard<'_, i32>`
note: future is not `Send` as this value is used across an await
   --> src/lib.rs:7:5
    |
4   |     let mut lock: MutexGuard<i32> = mutex.lock().unwrap();
    |         -------- has type `std::sync::MutexGuard<'_, i32>` which is not `Send`
...
7   |     do_something_async().await;
    |     ^^^^^^^^^^^^^^^^^^^^^^^^^^ await occurs here, with `mut lock` maybe used later
8   | }
    | - `mut lock` is later dropped here
```

错误的原因在于 `std::sync::MutexGuard` 类型并没有实现 `Send` 特征，这意味着你不能将一个 `Mutex` 锁发送到另一个线程，因为 `.await` 可能会让任务转移到另一个线程上执行，这个之前也介绍过。

#### 提前释放锁

要解决这个问题，就必须重构代码，让 `Mutex` 锁在 `.await` 被调用前就被释放掉。

```rust
// 下面的代码可以工作！
async fn increment_and_do_stuff(mutex: &Mutex<i32>) {
    {
        let mut lock: MutexGuard<i32> = mutex.lock().unwrap();
        *lock += 1;
    } // lock在这里超出作用域 (被释放)

    do_something_async().await;
}
```

> 大家可能已经发现，很多错误都是因为 `.await` 引起的，其实你只要记住，在 `.await` 执行期间，任务可能会在线程间转移，那么这些错误将变得很好理解，不必去死记硬背

但是下面的代码不工作：

```rust
use std::sync::{Mutex, MutexGuard};

async fn increment_and_do_stuff(mutex: &Mutex<i32>) {
    let mut lock: MutexGuard<i32> = mutex.lock().unwrap();
    *lock += 1;
    drop(lock);

    do_something_async().await;
}
```

原因我们之前解释过，编译器在这里不够聪明，目前它只能根据作用域的范围来判断，`drop` 虽然释放了锁，但是锁的作用域依然会持续到函数的结束，未来也许编译器会改进，但是现在至少还是不行的。

聪明的读者此时的小脑袋已经飞速运转起来，既然锁没有实现 `Send`， 那我们主动给它实现如何？这样不就可以顺利运行了吗？答案依然是不可以，原因就是我们之前提到过的死锁，如果一个任务获取了锁，然后还没释放就在 `.await` 期间被挂起，接着开始执行另一个任务，这个任务又去获取锁，就会导致死锁。

再来看看其它解决方法：

#### 重构代码：在 `.await` 期间不持有锁

之前的代码其实也是为了在 `.await` 期间不持有锁，但是我们还有更好的实现方式，例如，你可以把 `Mutex` 放入一个结构体中，并且只在该结构体的非异步方法中使用该锁:

```rust
use std::sync::Mutex;

struct CanIncrement {
    mutex: Mutex<i32>,
}
impl CanIncrement {
    // 该方法不是 `async`
    fn increment(&self) {
        let mut lock = self.mutex.lock().unwrap();
        *lock += 1;
    }
}

async fn increment_and_do_stuff(can_incr: &CanIncrement) {
    can_incr.increment();
    do_something_async().await;
}
```

#### 使用异步任务和通过消息传递来管理状态

该方法常常用于共享的资源是 I/O 类型的资源时，我们在下一章节将详细介绍。

#### 使用 Tokio 提供的异步锁

Tokio 提供的锁最大的优点就是：它可以在 `.await` 执行期间被持有，而且不会有任何问题。但是代价就是，这种异步锁的性能开销会更高，因此如果可以，使用之前的两种方法来解决会更好。

```rust
use tokio::sync::Mutex; // 注意，这里使用的是 Tokio 提供的锁

// 下面的代码会编译
// 但是就这个例子而言，之前的方式会更好
async fn increment_and_do_stuff(mutex: &Mutex<i32>) {
    let mut lock = mutex.lock().await;
    *lock += 1;

    do_something_async().await;
} // 锁在这里被释放
```



# 消息传递

迄今为止，你已经学了不少关于 Tokio 的并发编程的内容，是时候见识下真正的挑战了，接下来，我们一起来实现下客户端这块儿的功能。

首先，将之前实现的 `src/main.rs `文件中的[服务器端代码](https://github.com/tokio-rs/website/blob/master/tutorial-code/shared-state/src/main.rs)放入到一个 bin 文件中，等下可以直接通过该文件来运行我们的服务器:

```console
mkdir src/bin
mv src/main.rs src/bin/server.rs
```

接着创建一个新的 bin 文件，用于包含我们即将实现的客户端代码:

```console
touch src/bin/client.rs
```

由于不再使用 `main.rs` 作为程序入口，我们需要使用以下命令来运行指定的 bin 文件:

```rust
cargo run --bin server
```

此时，服务器已经成功运行起来。 同样的，可以用 `cargo run --bin client` 这种方式运行即将实现的客户端。

万事俱备，只欠代码，一起来看看客户端该如何实现。

## 错误的实现

如果想要同时运行两个 redis 命令，我们可能会为每一个命令生成一个任务，例如:

```rust
use mini_redis::client;

#[tokio::main]
async fn main() {
    // 创建到服务器的连接
    let mut client = client::connect("127.0.0.1:6379").await.unwrap();

    // 生成两个任务，一个用于获取 key, 一个用于设置 key
    let t1 = tokio::spawn(async {
        let res = client.get("hello").await;
    });

    let t2 = tokio::spawn(async {
        client.set("foo", "bar".into()).await;
    });

    t1.await.unwrap();
    t2.await.unwrap();
}
```

这段代码不会编译，因为两个任务都需要去访问 `client`，但是 `client` 并没有实现 `Copy` 特征，再加上我们并没有实现相应的共享代码，因此自然会报错。还有一个问题，方法 `set` 和 `get` 都使用了 `client` 的可变引用 `&mut self`，由此还会造成同时借用两个可变引用的错误。

在上一节中，我们介绍了几个解决方法，但是它们大部分都不太适用于此时的情况，例如：

- `std::sync::Mutex` 无法被使用，这个问题在之前章节有详解介绍过，同步锁无法跨越 `.await` 调用时使用
- 那么你可能会想，是不是可以使用 `tokio::sync:Mutex` ，答案是可以用，但是同时就只能运行一个请求。若客户端实现了 redis 的 [pipelining](https://redis.io/topics/pipelining), 那这个异步锁就会导致连接利用率不足

这个不行，那个也不行，是不是没有办法解决了？还记得我们上一章节提到过几次的消息传递，但是一直没有看到它的庐山真面目吗？现在可以来看看了。

## 消息传递

之前章节我们提到可以创建一个专门的任务 `C1` (消费者 Consumer) 和通过消息传递来管理共享的资源，这里的共享资源就是 `client` 。若任务 `P1` (生产者 Producer) 想要发出 Redis 请求，首先需要发送信息给 `C1`，然后 `C1` 会发出请求给服务器，在获取到结果后，再将结果返回给 `P1`。

在这种模式下，只需要建立一条连接，然后由一个统一的任务来管理 `client` 和该连接，这样之前的 `get` 和 `set` 请求也将不存在资源共享的问题。

同时，`P1` 和 `C1` 进行通信的消息通道是有缓冲的，当大量的消息发送给 `C1` 时，首先会放入消息通道的缓冲区中，当 `C1` 处理完一条消息后，再从该缓冲区中取出下一条消息进行处理，这种方式跟消息队列( Message queue ) 非常类似，可以实现更高的吞吐。而且这种方式还有利于实现连接池，例如不止一个 `P` 和 `C` 时，多个 `P` 可以往消息通道中发送消息，同时多个 `C`，其中每个 `C` 都维护一条连接，并从消息通道获取消息。

## Tokio 的消息通道( channel )

Tokio 提供了多种消息通道，可以满足不同场景的需求:

- [`mpsc`](https://docs.rs/tokio/1.15.0/tokio/sync/mpsc/index.html), 多生产者，单消费者模式
- [`oneshot`](https://docs.rs/tokio/1.15.0/tokio/sync/oneshot/index.html), 单生产者单消费，一次只能发送一条消息
- [`broadcast`](https://docs.rs/tokio/1/tokio/sync/broadcast/index.html)，多生产者，多消费者，其中每一条发送的消息都可以被所有接收者收到，因此是广播
- [`watch`](https://docs.rs/tokio/1/tokio/sync/watch/index.html)，单生产者，多消费者，只保存一条最新的消息，因此接收者只能看到最近的一条消息，例如，这种模式适用于配置文件变化的监听

细心的同学可能会发现，这里还少了一种类型：多生产者、多消费者，且每一条消息只能被其中一个消费者接收，如果有这种需求，可以使用 [`async-channel`](https://docs.rs/async-channel/latest/async_channel/) 包。

以上这些消息通道都有一个共同点：适用于 `async` 编程，对于其它场景，你可以使用在[多线程章节](https://course.rs/advance/concurrency-with-threads/message-passing.html)中提到过的 `std::sync::mpsc` 和 `crossbeam::channel`， 这些通道在等待消息时会阻塞当前的线程，因此不适用于 `async` 编程。

在下面的代码中，我们将使用 `mpsc` 和 `oneshot`， 本章节完整的代码见[这里](https://github.com/tokio-rs/website/blob/master/tutorial-code/channels/src/main.rs)。

## 定义消息类型

在大多数场景中使用消息传递时，都是多个发送者向一个任务发送消息，该任务在处理完后，需要将响应内容返回给相应的发送者。例如我们的例子中，任务需要将 `GET` 和 `SET` 命令处理的结果返回。首先，我们需要定一个 `Command` 枚举用于代表命令：

```rust
use bytes::Bytes;

#[derive(Debug)]
enum Command {
    Get {
        key: String,
    },
    Set {
        key: String,
        val: Bytes,
    }
}
```

## 创建消息通道

在 `src/bin/client.rs` 的 `main` 函数中，创建一个 `mpsc` 消息通道：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    // 创建一个新通道，缓冲队列长度是 32
    let (tx, mut rx) = mpsc::channel(32);

    // ... 其它代码
}
```

一个任务可以通过此通道将命令发送给管理 redis 连接的任务，同时由于通道支持多个生产者，因此多个任务可以同时发送命令。创建该通道会返回一个发送和接收句柄，这两个句柄可以分别被使用，例如它们可以被移动到不同的任务中。

通道的缓冲队列长度是 32，意味着如果消息发送的比接收的快，这些消息将被存储在缓冲队列中，一旦存满了 32 条消息，使用`send(...).await`的发送者会**进入睡眠**，直到缓冲队列可以放入新的消息(被接收者消费了)。

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(32);
    let tx2 = tx.clone();

    tokio::spawn(async move {
        tx.send("sending from first handle").await;
    });

    tokio::spawn(async move {
        tx2.send("sending from second handle").await;
    });

    while let Some(message) = rx.recv().await {
        println!("GOT = {}", message);
    }
}
```

你可以使用 `clone` 方法克隆多个发送者，但是接收者无法被克隆，因为我们的通道是 `mpsc` 类型。

当所有的发送者都被 `Drop` 掉后(超出作用域或被 `drop(...)` 函数主动释放)，就不再会有任何消息发送给该通道，此时 `recv` 方法将返回 `None`，也意味着该通道已经**被关闭**。

在我们的例子中，接收者是在管理 redis 连接的任务中，当该任务发现所有发送者都关闭时，它知道它的使命可以完成了，因此它会关闭 redis 连接。

## 生成管理任务

下面，我们来一起创建一个管理任务，它会管理 redis 的连接，当然，首先需要创建一条到 redis 的连接:

```rust
use mini_redis::client;
// 将消息通道接收者 rx 的所有权转移到管理任务中
let manager = tokio::spawn(async move {
    // Establish a connection to the server
    // 建立到 redis 服务器的连接
    let mut client = client::connect("127.0.0.1:6379").await.unwrap();

    // 开始接收消息
    while let Some(cmd) = rx.recv().await {
        use Command::*;

        match cmd {
            Get { key } => {
                client.get(&key).await;
            }
            Set { key, val } => {
                client.set(&key, val).await;
            }
        }
    }
});
```

如上所示，当从消息通道接收到一个命令时，该管理任务会将此命令通过 redis 连接发送到服务器。

现在，让两个任务发送命令到消息通道，而不是像最开始报错的那样，直接发送命令到各自的 redis 连接:

```rust
// 由于有两个任务，因此我们需要两个发送者
let tx2 = tx.clone();

// 生成两个任务，一个用于获取 key，一个用于设置 key
let t1 = tokio::spawn(async move {
    let cmd = Command::Get {
        key: "hello".to_string(),
    };

    tx.send(cmd).await.unwrap();
});

let t2 = tokio::spawn(async move {
    let cmd = Command::Set {
        key: "foo".to_string(),
        val: "bar".into(),
    };

    tx2.send(cmd).await.unwrap();
});
```

在 `main` 函数的末尾，我们让 3 个任务，按照需要的顺序开始运行:

```rust
t1.await.unwrap();
t2.await.unwrap();
manager.await.unwrap();
```

## 接收响应消息

最后一步，就是让发出命令的任务从管理任务那里获取命令执行的结果。为了完成这个目标，我们将使用 `oneshot` 消息通道，因为它针对一发一收的使用类型做过特别优化，且特别适用于此时的场景：接收一条从管理任务发送的结果消息。

```rust
use tokio::sync::oneshot;

let (tx, rx) = oneshot::channel();
```

使用方式跟 `mpsc` 很像，但是它并没有缓存长度，因为只能发送一条，接收一条，还有一点不同：你无法对返回的两个句柄进行 `clone`。

为了让管理任务将结果准确的返回到发送者手中，这个管道的发送端必须要随着命令一起发送, 然后发出命令的任务保留管道的发送端。一个比较好的实现就是将管道的发送端放入 `Command` 的数据结构中，同时使用一个别名来代表该发送端:

```rust
use tokio::sync::oneshot;
use bytes::Bytes;

#[derive(Debug)]
enum Command {
    Get {
        key: String,
        resp: Responder<Option<Bytes>>,
    },
    Set {
        key: String,
        val: Bytes,
        resp: Responder<()>,
    },
}


/// 管理任务可以使用该发送端将命令执行的结果传回给发出命令的任务
type Responder<T> = oneshot::Sender<mini_redis::Result<T>>;
```

下面，更新发送命令的代码：

```rust
let t1 = tokio::spawn(async move {
    let (resp_tx, resp_rx) = oneshot::channel();
    let cmd = Command::Get {
        key: "hello".to_string(),
        resp: resp_tx,
    };

    // 发送 GET 请求
    tx.send(cmd).await.unwrap();

    // 等待回复
    let res = resp_rx.await;
    println!("GOT = {:?}", res);
});

let t2 = tokio::spawn(async move {
    let (resp_tx, resp_rx) = oneshot::channel();
    let cmd = Command::Set {
        key: "foo".to_string(),
        val: "bar".into(),
        resp: resp_tx,
    };

    // 发送 SET 请求
    tx2.send(cmd).await.unwrap();

    // 等待回复
    let res = resp_rx.await;
    println!("GOT = {:?}", res);
});
```

最后，更新管理任务:

```rust
while let Some(cmd) = rx.recv().await {
    match cmd {
        Command::Get { key, resp } => {
            let res = client.get(&key).await;
            // 忽略错误
            let _ = resp.send(res);
        }
        Command::Set { key, val, resp } => {
            let res = client.set(&key, val).await;
            // 忽略错误
            let _ = resp.send(res);
        }
    }
}
```

有一点值得注意，往 `oneshot` 中发送消息时，并没有使用 `.await`，原因是该发送操作要么直接成功、要么失败，并不需要等待。

当 `oneshot` 的接受端被 `drop` 后，继续发送消息会直接返回 `Err` 错误，它表示接收者已经不感兴趣了。对于我们的场景，接收者不感兴趣是非常合理的操作，并不是一种错误，因此可以直接忽略。

本章的完整代码见[这里](https://github.com/tokio-rs/website/blob/master/tutorial-code/channels/src/main.rs)。

## 对消息通道进行限制

无论何时使用消息通道，我们都需要对缓存队列的长度进行限制，这样系统才能优雅的处理各种负载状况。如果不限制，假设接收端无法及时处理消息，那消息就会迅速堆积，最终可能会导致内存消耗殆尽，就算内存没有消耗完，也可能会导致整体性能的大幅下降。

Tokio 在设计时就考虑了这种状况，例如 `async` 操作在 Tokio 中是惰性的:

```rust
loop {
    async_op();
}
```

如果上面代码中，`async_op` 不是惰性的，而是在每次循环时立即执行，那该循环会立即将一个 `async_op` 发送到缓冲队列中，然后开始执行下一个循环，因为无需等待任务执行完成，这种发送速度是非常恐怖的，一秒钟可能会有几十万、上百万的消息发送到消息队列中。在其它语言编程中，相信大家也或多或少遇到过这种情况。

然后在 `Async Rust` 和 Tokio 中，上面的代码 `async_op` 根本就不会运行，也就不会往消息队列中写入消息。原因是我们没有调用 `.await`，就算使用了 `.await` 上面的代码也不会有问题，因为只有等当前循环的任务结束后，才会开始下一次循环。

```rust
loop {
    // 当前 `async_op` 完成后，才会开始下一次循环
    async_op().await;
}
```

总之，在 Tokio 中我们必须要显式地引入并发和队列:

- `tokio::spawn`
- `select!`
- `join!`
- `mpsc::channel`

当这么做时，我们需要小心的控制并发度来确保系统的安全。例如，当使用一个循环去接收 TCP 连接时，你要确保当前打开的 `socket` 数量在可控范围内，而不是毫无原则的接收连接。 再比如，当使用 `mpsc::channel` 时，要设置一个缓冲值。

挑选一个合适的限制值是 `Tokio` 编程中很重要的一部分，可以帮助我们的系统更加安全、可靠的运行。



# 解析数据帧

现在，鉴于大家已经掌握了 Tokio 的基本 I/O 用法，我们可以开始实现 `mini-redis` 的帧 `frame`。通过帧可以将字节流转换成帧组成的流。每个帧就是一个数据单元，例如客户端发送的一次请求就是一个帧。

```rust
use bytes::Bytes;

enum Frame {
    Simple(String),
    Error(String),
    Integer(u64),
    Bulk(Bytes),
    Null,
    Array(Vec<Frame>),
}
```

可以看到帧除了数据之外，并不具备任何语义。命令解析和实现会在更高的层次进行(相比帧解析层）。我们再来通过 HTTP 的帧来帮大家加深下相关的理解：

```rust
enum HttpFrame {
    RequestHead {
        method: Method,
        uri: Uri,
        version: Version,
        headers: HeaderMap,
    },
    ResponseHead {
        status: StatusCode,
        version: Version,
        headers: HeaderMap,
    },
    BodyChunk {
        chunk: Bytes,
    },
}
```

为了实现 `mini-redis` 的帧，我们需要一个 `Connection` 结构体，里面包含了一个 `TcpStream` 以及对帧进行读写的方法:

```rust
use tokio::net::TcpStream;
use mini_redis::{Frame, Result};

struct Connection {
    stream: TcpStream,
    // ... 这里定义其它字段
}

impl Connection {
    /// 从连接读取一个帧
    ///
    /// 如果遇到EOF，则返回 None
    pub async fn read_frame(&mut self)
        -> Result<Option<Frame>>
    {
      // 具体实现
    }

    /// 将帧写入到连接中
    pub async fn write_frame(&mut self, frame: &Frame)
        -> Result<()>
    {
        // 具体实现
    }
}
```

关于 Redis 协议的说明，可以看看[官方文档](https://redis.io/topics/protocol)，`Connection` 代码的完整实现见[这里](https://github.com/tokio-rs/mini-redis/blob/tutorial/src/connection.rs).

## 缓冲读取(Buffered Reads)

`read_frame` 方法会等到一个完整的帧都读取完毕后才返回，与之相比，它底层调用的`TcpStream::read` 只会返回任意多的数据(填满传入的缓冲区 buffer )，它可能返回帧的一部分、一个帧、多个帧，总之这种读取行为是不确定的。

当 `read_frame` 的底层调用 `TcpStream::read` 读取到部分帧时，会将数据先缓冲起来，接着继续等待并读取数据。如果读到多个帧，那第一个帧会被返回，然后剩下的数据依然被缓冲起来，等待下一次 `read_frame` 被调用。

为了实现这种功能，我们需要为 `Connection` 增加一个读取缓冲区。数据首先从 `socket` 中读取到缓冲区中，接着这些数据会被解析为帧，当一个帧被解析后，该帧对应的数据会从缓冲区被移除。

这里使用 [`BytesMut`](https://docs.rs/bytes/1/bytes/struct.BytesMut.html) 作为缓冲区类型，它是 [`Bytes`](https://docs.rs/bytes/1/bytes/struct.Bytes.html) 的可变版本。

```rust
use bytes::BytesMut;
use tokio::net::TcpStream;

pub struct Connection {
    stream: TcpStream,
    buffer: BytesMut,
}

impl Connection {
    pub fn new(stream: TcpStream) -> Connection {
        Connection {
            stream,
            // 分配一个缓冲区，具有4kb的缓冲长度
            buffer: BytesMut::with_capacity(4096),
        }
    }
}
```

接下来，实现 `read_frame` 方法:

```rust
use tokio::io::AsyncReadExt;
use bytes::Buf;
use mini_redis::Result;

pub async fn read_frame(&mut self)
    -> Result<Option<Frame>>
{
    loop {
        // 尝试从缓冲区的数据中解析出一个数据帧，
        // 只有当数据足够被解析时，才返回对应的帧
        if let Some(frame) = self.parse_frame()? {
            return Ok(Some(frame));
        }

        // 如果缓冲区中的数据还不足以被解析为一个数据帧，
        // 那么我们需要从 socket 中读取更多的数据
        //
        // 读取成功时，会返回读取到的字节数，0 代表着读到了数据流的末尾
        if 0 == self.stream.read_buf(&mut self.buffer).await? {
            // 代码能执行到这里，说明了对端关闭了连接，
            // 需要看看缓冲区是否还有数据，若没有数据，说明所有数据成功被处理，
            // 若还有数据，说明对端在发送帧的过程中断开了连接，导致只发送了部分数据
            if self.buffer.is_empty() {
                return Ok(None);
            } else {
                return Err("connection reset by peer".into());
            }
        }
    }
}
```

`read_frame` 内部使用循环的方式读取数据，直到一个完整的帧被读取到时，才会返回。当然，当远程的对端关闭了连接后，也会返回。

#### `Buf` 特征

在上面的 `read_frame` 方法中，我们使用了 `read_buf` 来读取 socket 中的数据，该方法的参数是来自 [`bytes`](https://docs.rs/bytes/) 包的 `BufMut`。

可以先来考虑下该如何使用 `read()` 和 `Vec<u8>` 来实现同样的功能 :

```rust
use tokio::net::TcpStream;

pub struct Connection {
    stream: TcpStream,
    buffer: Vec<u8>,
    cursor: usize,
}

impl Connection {
    pub fn new(stream: TcpStream) -> Connection {
        Connection {
            stream,
            // 4kb 大小的缓冲区
            buffer: vec![0; 4096],
            cursor: 0,
        }
    }
}
```

下面是相应的 `read_frame` 方法:

```rust
use mini_redis::{Frame, Result};

pub async fn read_frame(&mut self)
    -> Result<Option<Frame>>
{
    loop {
        if let Some(frame) = self.parse_frame()? {
            return Ok(Some(frame));
        }

        // 确保缓冲区长度足够
        if self.buffer.len() == self.cursor {
            // 若不够，需要增加缓冲区长度
            self.buffer.resize(self.cursor * 2, 0);
        }

        // 从游标位置开始将数据读入缓冲区
        let n = self.stream.read(
            &mut self.buffer[self.cursor..]).await?;

        if 0 == n {
            if self.cursor == 0 {
                return Ok(None);
            } else {
                return Err("connection reset by peer".into());
            }
        } else {
            // 更新游标位置
            self.cursor += n;
        }
    }
}
```

在这段代码中，我们使用了非常重要的技术：通过游标( cursor )跟踪已经读取的数据，并将下次读取的数据写入到游标之后的缓冲区中，只有这样才不会让新读取的数据将之前读取的数据覆盖掉。

一旦缓冲区满了，还需要增加缓冲区的长度，这样才能继续写入数据。还有一点值得注意，在 `parse_frame` 方法的内部实现中，也需要通过游标来解析数据: `self.buffer[..self.cursor]`，通过这种方式，我们可以准确获取到目前已经读取的全部数据。

在网络编程中，通过字节数组和游标的方式读取数据是非常普遍的，因此 `bytes` 包提供了一个 `Buf` 特征，如果一个类型可以被读取数据，那么该类型需要实现 `Buf` 特征。与之对应，当一个类型可以被写入数据时，它需要实现 `BufMut` 。

当 `T: BufMut` ( 特征约束，说明类型 `T` 实现了 `BufMut` 特征 ) 被传给 `read_buf()` 方法时，缓冲区 `T` 的内部游标会自动进行更新。正因为如此，在使用了 `BufMut` 版本的 `read_frame` 中，我们并不需要管理自己的游标。

除了游标之外，`Vec<u8>` 的使用也值得关注，该缓冲区在使用时必须要被初始化: `vec![0; 4096]`，该初始化会创建一个 4096 字节长度的数组，然后将数组的每个元素都填充上 0 。当缓冲区长度不足时，新创建的缓冲区数组依然会使用 0 被重新填充一遍。 事实上，这种初始化过程会存在一定的性能开销。

与 `Vec<u8>` 相反， `BytesMut` 和 `BufMut` 就没有这个问题，它们无需被初始化，而且 `BytesMut` 还会阻止我们读取未初始化的内存。

## 帧解析

在理解了该如何读取数据后， 再来看看该如何通过两个部分解析出一个帧：

- 确保有一个完整的帧已经被写入了缓冲区，找到该帧的最后一个字节所在的位置
- 解析帧

```rust
use mini_redis::{Frame, Result};
use mini_redis::frame::Error::Incomplete;
use bytes::Buf;
use std::io::Cursor;

fn parse_frame(&mut self)
    -> Result<Option<Frame>>
{
    // 创建 `T: Buf` 类型
    let mut buf = Cursor::new(&self.buffer[..]);

    // 检查是否读取了足够解析出一个帧的数据
    match Frame::check(&mut buf) {
        Ok(_) => {
            // 获取组成该帧的字节数
            let len = buf.position() as usize;

            // 在解析开始之前，重置内部的游标位置
            buf.set_position(0);

            // 解析帧
            let frame = Frame::parse(&mut buf)?;

            // 解析完成，将缓冲区该帧的数据移除
            self.buffer.advance(len);

            // 返回解析出的帧
            Ok(Some(frame))
        }
        // 缓冲区的数据不足以解析出一个完整的帧
        Err(Incomplete) => Ok(None),
        // 遇到一个错误
        Err(e) => Err(e.into()),
    }
}
```

完整的 `Frame::check` 函数实现在[这里](https://github.com/tokio-rs/mini-redis/blob/tutorial/src/frame.rs#L63-L100)，感兴趣的同学可以看看，在这里我们不会对它进行完整的介绍。

值得一提的是, `Frame::check` 使用了 `Buf` 的字节迭代风格的 API。例如，为了解析一个帧，首先需要检查它的第一个字节，该字节用于说明帧的类型。这种首字节检查是通过 `Buf::get_u8` 函数完成的，该函数会获取游标所在位置的字节，然后将游标位置向右移动一个字节。

## 缓冲写入(Buffered writes)

关于帧操作的另一个 API 是 `write_frame(frame)` 函数，它会将一个完整的帧写入到 socket 中。 每一次写入，都会触发一次或数次系统调用，当程序中有大量的连接和写入时，系统调用的开销将变得非常高昂，具体可以看看 SyllaDB 团队写过的一篇[性能调优文章](https://www.scylladb.com/2022/01/12/async-rust-in-practice-performance-pitfalls-profiling/)。

为了降低系统调用的次数，我们需要使用一个写入缓冲区，当写入一个帧时，首先会写入该缓冲区，然后等缓冲区数据足够多时，再集中将其中的数据写入到 socket 中，这样就将多次系统调用优化减少到一次。

还有，缓冲区也不总是能提升性能。 例如，考虑一个 `bulk` 帧(多个帧放在一起组成一个 bulk，通过批量发送提升效率)，该帧的特点就是：由于由多个帧组合而成，因此帧体数据可能会很大。所以我们不能将其帧体数据写入到缓冲区中，因为数据较大时，先写入缓冲区再写入 socket 会有较大的性能开销(实际上缓冲区就是为了批量写入，既然 bulk 已经是批量了，因此不使用缓冲区也很正常)。

为了实现缓冲写，我们将使用 [`BufWriter`](https://docs.rs/tokio/1/tokio/io/struct.BufWriter.html) 结构体。该结构体实现了 `AsyncWrite` 特征，当 `write` 方法被调用时，不会直接写入到 socket 中，而是先写入到缓冲区中。当缓冲区被填满时，其中的内容会自动刷到(写入到)内部的 socket 中，然后再将缓冲区清空。当然，其中还存在某些优化，通过这些优化可以绕过缓冲区直接访问 socket。

由于篇幅有限，我们不会实现完整的 `write_frame` 函数，想要看完整代码可以访问[这里](https://github.com/tokio-rs/mini-redis/blob/tutorial/src/connection.rs#L159-L184)。

首先，更新下 `Connection` 的结构体:

```rust
use tokio::io::BufWriter;
use tokio::net::TcpStream;
use bytes::BytesMut;

pub struct Connection {
    stream: BufWriter<TcpStream>,
    buffer: BytesMut,
}

impl Connection {
    pub fn new(stream: TcpStream) -> Connection {
        Connection {
            stream: BufWriter::new(stream),
            buffer: BytesMut::with_capacity(4096),
        }
    }
}
```

接着来实现 `write_frame` 函数:

```rust
use tokio::io::{self, AsyncWriteExt};
use mini_redis::Frame;

async fn write_frame(&mut self, frame: &Frame)
    -> io::Result<()>
{
    match frame {
        Frame::Simple(val) => {
            self.stream.write_u8(b'+').await?;
            self.stream.write_all(val.as_bytes()).await?;
            self.stream.write_all(b"\r\n").await?;
        }
        Frame::Error(val) => {
            self.stream.write_u8(b'-').await?;
            self.stream.write_all(val.as_bytes()).await?;
            self.stream.write_all(b"\r\n").await?;
        }
        Frame::Integer(val) => {
            self.stream.write_u8(b':').await?;
            self.write_decimal(*val).await?;
        }
        Frame::Null => {
            self.stream.write_all(b"$-1\r\n").await?;
        }
        Frame::Bulk(val) => {
            let len = val.len();

            self.stream.write_u8(b'$').await?;
            self.write_decimal(len as u64).await?;
            self.stream.write_all(val).await?;
            self.stream.write_all(b"\r\n").await?;
        }
        Frame::Array(_val) => unimplemented!(),
    }

    self.stream.flush().await;

    Ok(())
}
```

这里使用的方法由 `AsyncWriteExt` 提供，它们在 `TcpStream` 中也有对应的函数。但是在没有缓冲区的情况下最好避免使用这种逐字节的写入方式！不然，每写入几个字节就会触发一次系统调用，写完整个数据帧可能需要几十次系统调用，可以说是丧心病狂！

- `write_u8` 写入一个字节
- `write_all` 写入所有数据
- `write_decimal`由 mini-redis 提供

在函数结束前，我们还额外的调用了一次 `self.stream.flush().await`，原因是缓冲区可能还存在数据，因此需要手动刷一次数据：`flush` 的调用会将缓冲区中剩余的数据立刻写入到 socket 中。

当然，当帧比较小的时候，每写一次帧就 flush 一次的模式性能开销会比较大，此时我们可以选择在 `Connection` 中实现 `flush` 函数，然后将等帧积累多个后，再一次性在 `Connection` 中进行 flush。当然，对于我们的例子来说，简洁性是非常重要的，因此选了将 `flush` 放入到 `write_frame` 中。



# 深入 Tokio 背后的异步原理

在经过多个章节的深入学习后，Tokio 对我们来说不再是一座隐于云雾中的高山，它其实蛮简单好用的，甚至还有一丝丝的可爱!?

但从现在开始，如果想要进一步的深入 Tokio ，首先需要深入理解 `async` 的原理，其实我们在[之前的章节](https://course.rs/async/intro.html)已经深入学习过，这里结合 Tokio 再来回顾下。

## Future

先来回顾一下 `async fn` 异步函数 :

```rust
use tokio::net::TcpStream;

async fn my_async_fn() {
    println!("hello from async");
    // 通过 .await 创建 socket 连接
    let _socket = TcpStream::connect("127.0.0.1:3000").await.unwrap();
    println!("async TCP operation complete");
    // 关闭socket
}
```

接着对它进行调用获取一个返回值，再在返回值上调用 `.await`：

```rust
#[tokio::main]
async fn main() {
    let what_is_this = my_async_fn();
    // 上面的调用不会产生任何效果

    // ... 执行一些其它代码


    what_is_this.await;
    // 直到 .await 后，文本才被打印，socket 连接也被创建和关闭
}
```

在上面代码中 `my_async_fn` 函数为何可以惰性执行( 直到 .await 调用时才执行)？秘密就在于 `async fn` 声明的函数返回一个 `Future`。

`Future` 是一个实现了 [`std::future::Future`](https://doc.rust-lang.org/std/future/trait.Future.html) 特征的值，该值包含了一系列异步计算过程，而这个过程直到 `.await` 调用时才会被执行。

`std::future::Future` 的定义如下所示:

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context)
        -> Poll<Self::Output>;
}
```

代码中有几个关键点：

- [关联类型](https://course.rs/basic/trait/advance-trait.html#关联类型) `Output` 是 `Future` 执行完成后返回的值的类型
- `Pin` 类型是在异步函数中进行借用的关键，在[这里](https://course.rs/async/pin-unpin.html)有非常详细的介绍

和其它语言不同，Rust 中的 `Future` 不代表一个发生在后台的计算，而是 `Future` 就代表了计算本身，因此
`Future` 的所有者有责任去推进该计算过程的执行，例如通过 `Future::poll` 函数。听上去好像还挺复杂？但是大家不必担心，因为这些都在 Tokio 中帮你自动完成了 :)

#### 实现 Future

下面来一起实现个五脏俱全的 `Future`，它将：1. 等待某个特定时间点的到来 2. 在标准输出打印文本 3. 生成一个字符串

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};

struct Delay {
    when: Instant,
}

// 为我们的 Delay 类型实现 Future 特征
impl Future for Delay {
    type Output = &'static str;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<&'static str>
    {
        if Instant::now() >= self.when {
            // 时间到了，Future 可以结束
            println!("Hello world");
            // Future 执行结束并返回 "done" 字符串
            Poll::Ready("done")
        } else {
            // 目前先忽略下面这行代码
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}

#[tokio::main]
async fn main() {
    let when = Instant::now() + Duration::from_millis(10);
    let future = Delay { when };

    // 运行并等待 Future 的完成
    let out = future.await;

    // 判断 Future 返回的字符串是否是 "done"
    assert_eq!(out, "done");
}
```

以上代码很清晰的解释了如何自定义一个 `Future`，并指定它如何通过 `poll` 一步一步执行，直到最终完成返回 `"done"` 字符串。

#### async fn 作为 Future

大家有没有注意到，上面代码我们在 `main` 函数中初始化一个 `Future` 并使用 `.await` 对其进行调用执行，如果你是在 `fn main` 中这么做，是会报错的。

原因是 `.await` 只能用于 `async fn` 函数中，因此我们将 `main` 函数声明成 `async fn main` 同时使用 `#[tokio::main]` 进行了标注，此时 `async fn main` 生成的代码类似下面：

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};

enum MainFuture {
    // 初始化，但永远不会被 poll
    State0,
    // 等待 `Delay` 运行，例如 `future.await` 代码行
    State1(Delay),
    // Future 执行完成
    Terminated,
}

impl Future for MainFuture {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<()>
    {
        use MainFuture::*;

        loop {
            match *self {
                State0 => {
                    let when = Instant::now() +
                        Duration::from_millis(10);
                    let future = Delay { when };
                    *self = State1(future);
                }
                State1(ref mut my_future) => {
                    match Pin::new(my_future).poll(cx) {
                        Poll::Ready(out) => {
                            assert_eq!(out, "done");
                            *self = Terminated;
                            return Poll::Ready(());
                        }
                        Poll::Pending => {
                            return Poll::Pending;
                        }
                    }
                }
                Terminated => {
                    panic!("future polled after completion")
                }
            }
        }
    }
}
```

可以看出，编译器会将 `Future` 变成状态机， 其中 `MainFuture` 包含了 `Future` 可能处于的状态：从 `State0` 状态开始，当 `poll` 被调用时， `Future` 会尝试去尽可能的推进内部的状态，若它可以被完成时，就会返回 `Poll::Ready`，其中还会包含最终的输出结果。

若 `Future` 无法被完成，例如它所等待的资源还没有准备好，此时就会返回 `Poll::Pending`，该返回值会通知调用者： `Future` 会在稍后才能完成。

同时可以看到：当一个 `Future` 由其它 `Future` 组成时，调用外层 `Future` 的 `poll` 函数会同时调用一次内部 `Future` 的 `poll` 函数。

## 执行器( Excecutor )

`async fn` 返回 `Future` ，而后者需要通过被不断的 `poll` 才能往前推进状态，同时该 `Future` 还能包含其它 `Future` ，那么问题来了谁来负责调用最外层 `Future` 的 `poll` 函数？

回一下之前的内容，为了运行一个异步函数，我们必须使用 `tokio::spawn` 或 通过 `#[tokio::main]` 标注的 `async fn main` 函数。它们有一个非常重要的作用：将最外层 `Future` 提交给 Tokio 的执行器。该执行器负责调用 `poll` 函数，然后推动 `Future` 的执行，最终直至完成。

#### mini tokio

为了更好理解相关的内容，我们一起来实现一个迷你版本的 Tokio，完整的代码见[这里](https://github.com/tokio-rs/website/blob/master/tutorial-code/mini-tokio/src/main.rs)。

先来看一段基础代码:

```rust
use std::collections::VecDeque;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};
use futures::task;

fn main() {
    let mut mini_tokio = MiniTokio::new();

    mini_tokio.spawn(async {
        let when = Instant::now() + Duration::from_millis(10);
        let future = Delay { when };

        let out = future.await;
        assert_eq!(out, "done");
    });

    mini_tokio.run();
}

struct MiniTokio {
    tasks: VecDeque<Task>,
}

type Task = Pin<Box<dyn Future<Output = ()> + Send>>;

impl MiniTokio {
    fn new() -> MiniTokio {
        MiniTokio {
            tasks: VecDeque::new(),
        }
    }

    /// 生成一个 Future并放入 mini-tokio 实例的任务队列中
    fn spawn<F>(&mut self, future: F)
    where
        F: Future<Output = ()> + Send + 'static,
    {
        self.tasks.push_back(Box::pin(future));
    }

    fn run(&mut self) {
        let waker = task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        while let Some(mut task) = self.tasks.pop_front() {
            if task.as_mut().poll(&mut cx).is_pending() {
                self.tasks.push_back(task);
            }
        }
    }
}
```

以上代码运行了一个 `async` 语句块 `mini_tokio.spawn(async {...})`， 还创建了一个 `Delay` 实例用于等待所需的时间。看上去相当不错，但这个实现有一个 **重大缺陷**：我们的执行器永远也不会休眠。执行器会持续的循环遍历所有的 `Future` ，然后不停的 `poll` 它们，但是事实上，大多数 `poll` 都是没有用的，因为此时 `Future` 并没有准备好，因此会继续返回 `Poll::Pending` ，最终这个循环遍历会让你的 CPU 疲于奔命，真打工人！

鉴于此，我们的 mini-tokio 只应该在 `Future` 准备好可以进一步运行后，才去 `poll` 它，例如该 `Future` 之前阻塞等待的**资源**已经准备好并可以被使用了，就可以对其进行 `poll`。再比如，如果一个 `Future` 任务在阻塞等待从 TCP socket 中读取数据，那我们只想在 `socket` 中有数据可以读取后才去 `poll` 它，而不是没事就 `poll` 着玩。

回到上面的代码中，mini-tokio 只应该当任务的延迟时间到了后，才去 `poll` 它。 为了实现这个功能，我们需要 `通知 -> 运行` 机制：当任务可以进一步被推进运行时，它会主动通知执行器，然后执行器再来 `poll`。

## Waker

一切的答案都在 `Waker` 中，资源可以用它来通知正在等待的任务：该资源已经准备好，可以继续运行了。

再来看下 `Future::poll` 的定义：

```rust
fn poll(self: Pin<&mut Self>, cx: &mut Context)
    -> Poll<Self::Output>;
```

`Context` 参数中包含有 `waker()`方法。该方法返回一个绑定到当前任务上的 `Waker`，然后 `Waker` 上定义了一个 `wake()` 方法，用于通知执行器相关的任务可以继续执行。

准确来说，当 `Future` 阻塞等待的资源已经准备好时(例如 socket 中有了可读取的数据)，该资源可以调用 `wake()` 方法，来通知执行器可以继续调用该 `Future` 的 `poll` 函数来推进任务的执行。

#### 发送 wake 通知

现在，为 `Delay` 添加下 `Waker` 支持：

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};
use std::thread;

struct Delay {
    when: Instant,
}

impl Future for Delay {
    type Output = &'static str;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<&'static str>
    {
        if Instant::now() >= self.when {
            println!("Hello world");
            Poll::Ready("done")
        } else {
            // 为当前任务克隆一个 waker 的句柄
            let waker = cx.waker().clone();
            let when = self.when;

            // 生成一个计时器线程
            thread::spawn(move || {
                let now = Instant::now();

                if now < when {
                    thread::sleep(when - now);
                }

                waker.wake();
            });

            Poll::Pending
        }
    }
}
```

此时，计时器用来模拟一个阻塞等待的资源，一旦计时结束(该资源已经准备好)，资源会通过 `waker.wake()` 调用通知执行器我们的任务再次被调度执行了。

当然，现在的实现还较为粗糙，等会我们会来进一步优化，在此之前，先来看看如何监听这个 `wake` 通知。

> 当 Future 会返回 `Poll::Pending` 时，一定要确保 `wake` 能被正常调用，否则会导致任务永远被挂起，再也不会被执行器 `poll`。
>
> **忘记在返回 `Poll::Pending` 时调用 `wake` 是很多难以发现 bug 的潜在源头！**

再回忆下最早实现的 `Delay` 代码：

```rust
impl Future for Delay {
    type Output = &'static str;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<&'static str>
    {
        if Instant::now() >= self.when {
            // 时间到了，Future 可以结束
            println!("Hello world");
            // Future 执行结束并返回 "done" 字符串
            Poll::Ready("done")
        } else {
            // 目前先忽略下面这行代码
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}
```

在返回 `Poll::Pending` 之前，先调用了 `cx.waker().wake_by_ref()` ，由于此时我们还没有模拟计时资源，因此这里直接调用了 `wake` 进行通知，这样做会导致当前的 `Future` 被立即再次调度执行。

由此可见，这种通知的控制权是在你手里的，甚至可以像上面代码这样，还没准备好资源，就直接进行 `wake` 通知，但是总归意义不大，而且浪费了 CPU，因为这种 `执行 -> 立即通知再调度 -> 执行` 的方式会造成一个非常繁忙的循环。

#### 处理 wake 通知

下面，让我们更新 mint-tokio 服务，让它能接收 wake 通知：当 `waker.wake()` 被调用后，相关联的任务会被放入执行器的队列中，然后等待执行器的调用执行。

为了实现这一点，我们将使用消息通道来排队存储这些被唤醒并等待调度的任务。有一点需要注意，从消息通道接收消息的线程(执行器所在的线程)和发送消息的线程（唤醒任务时所在的线程）可能是不同的，因此消息( `Waker` )必须要实现 `Send`和 `Sync`，才能跨线程使用。

> 关于 `Send` 和 `Sync` 的具体讲解见[这里](https://course.rs/advance/concurrency-with-threads/send-sync.html)

基于以上理由，我们选择使用来自于 `crossbeam` 的消息通道，因为标准库中的消息通道不是 `Sync` 的。在 `Cargo.toml` 中添加以下依赖：

```toml
crossbeam = "0.8"
```

再来更新下 `MiniTokio` 结构体：

```rust
use crossbeam::channel;
use std::sync::Arc;

struct MiniTokio {
    scheduled: channel::Receiver<Arc<Task>>,
    sender: channel::Sender<Arc<Task>>,
}

struct Task {
    // 先空着，后面会填充代码
}
```

`Waker` 实现了 `Sync` 特征，同时还可以被克隆，当 `wake` 被调用时，任务就会被调度执行。

为了实现上述的目的，我们引入了消息通道，当 `waker.wake()` 函数被调用时，任务会被发送到该消息通道中:

```rust
use std::sync::{Arc, Mutex};

struct Task {
    // `Mutex` 是为了让 `Task` 实现 `Sync` 特征，它能保证同一时间只有一个线程可以访问 `Future`。
    // 事实上 `Mutex` 并没有在 Tokio 中被使用，这里我们只是为了简化： Tokio 的真实代码实在太长了 :D
    future: Mutex<Pin<Box<dyn Future<Output = ()> + Send>>>,
    executor: channel::Sender<Arc<Task>>,
}

impl Task {
    fn schedule(self: &Arc<Self>) {
        self.executor.send(self.clone());
    }
}
```

接下来，我们需要让 `std::task::Waker` 能准确的找到所需的调度函数 关联起来，对此标准库中提供了一个底层的 API [`std::task::RawWakerVTable`](https://doc.rust-lang.org/std/task/struct.RawWakerVTable.html) 可以用于手动的访问 `vtable`，这种实现提供了最大的灵活性，但是需要大量 `unsafe` 的代码。

因此我们选择更加高级的实现：由 `futures` 包提供的 [`ArcWake`](https://docs.rs/futures/0.3.19/futures/task/trait.ArcWake.html) 特征，只要简单实现该特征，就可以将我们的 `Task` 转变成一个 `waker`。在 `Cargo.toml` 中添加以下包：

```toml
futures = "0.3"
```

然后为我们的任务 `Task` 实现 `ArcWake`:

```rust
use futures::task::{self, ArcWake};
use std::sync::Arc;
impl ArcWake for Task {
    fn wake_by_ref(arc_self: &Arc<Self>) {
        arc_self.schedule();
    }
}
```

当之前的计时器线程调用 `waker.wake()` 时，所在的任务会被推入到消息通道中。因此接下来，我们需要实现接收端的功能，然后 `MiniTokio::run()` 函数中执行该任务:

```rust
impl MiniTokio {
    // 从消息通道中接收任务，然后通过 poll 来执行
    fn run(&self) {
        while let Ok(task) = self.scheduled.recv() {
            task.poll();
        }
    }

    /// 初始化一个新的 mini-tokio 实例
    fn new() -> MiniTokio {
        let (sender, scheduled) = channel::unbounded();

        MiniTokio { scheduled, sender }
    }


    /// 在下面函数中，通过参数传入的 future 被 `Task` 包裹起来，然后会被推入到调度队列中，当 `run` 被调用时，该 future 将被执行
    fn spawn<F>(&self, future: F)
    where
        F: Future<Output = ()> + Send + 'static,
    {
        Task::spawn(future, &self.sender);
    }
}

impl Task {
    fn poll(self: Arc<Self>) {
        // 基于 Task 实例创建一个 waker, 它使用了之前的 `ArcWake`
        let waker = task::waker(self.clone());
        let mut cx = Context::from_waker(&waker);

        // 没有其他线程在竞争锁时，我们将获取到目标 future
        let mut future = self.future.try_lock().unwrap();

        // 对 future 进行 poll
        let _ = future.as_mut().poll(&mut cx);
    }

    // 使用给定的 future 来生成新的任务
    //
    // 新的任务会被推到 `sender` 中，接着该消息通道的接收端就可以获取该任务，然后执行
    fn spawn<F>(future: F, sender: &channel::Sender<Arc<Task>>)
    where
        F: Future<Output = ()> + Send + 'static,
    {
        let task = Arc::new(Task {
            future: Mutex::new(Box::pin(future)),
            executor: sender.clone(),
        });

        let _ = sender.send(task);
    }

}
```

首先，我们实现了 `MiniTokio::run()` 函数，它会持续从消息通道中接收被唤醒的任务，然后通过 `poll` 来推动其继续执行。

其次，`MiniTokio::new()` 和 `MiniTokio::spawn()` 使用了消息通道而不是一个 `VecDeque` 。当新任务生成后，这些任务中会携带上消息通道的发送端，当任务中的资源准备就绪时，会使用该发送端将该任务放入消息通道的队列中，等待执行器 `poll`。

`Task::poll()` 函数使用 `futures` 包提供的 `ArcWake` 创建了一个 `waker`，后者可以用来创建 `task::Context`，最终该 `Context` 会被传给执行器调用的 `poll` 函数。

> 注意，Task::poll 和执行器调用的 poll 是完全不同的，大家别搞混了

## 一些遗留问题

至此，我们的程序已经差不多完成，还剩几个遗留问题需要解决下。

#### 在异步函数中生成异步任务

之前实现 `Delay Future` 时，我们提到有几个问题需要解决。Rust 的异步模型允许一个 Future 在执行过程中可以跨任务迁移:

```rust
use futures::future::poll_fn;
use std::future::Future;
use std::pin::Pin;

#[tokio::main]
async fn main() {
    let when = Instant::now() + Duration::from_millis(10);
    let mut delay = Some(Delay { when });

    poll_fn(move |cx| {
        let mut delay = delay.take().unwrap();
        let res = Pin::new(&mut delay).poll(cx);
        assert!(res.is_pending());
        tokio::spawn(async move {
            delay.await;
        });

        Poll::Ready(())
    }).await;
}
```

首先，`poll_fn` 函数使用闭包创建了一个 `Future`，其次，上面代码还创建一个 `Delay` 实例，然后在闭包中，对其进行了一次 `poll` ，接着再将该 `Delay` 实例发送到一个新的任务，在此任务中使用 `.await` 进行了执行。

在例子中，`Delay:poll` 被调用了不止一次，且使用了不同的 `Waker` 实例，在这种场景下，你必须确保调用最近一次 `poll` 函数中的 `Waker` 参数中的`wake`方法。也就是调用最内层 `poll` 函数参数( `Waker` )上的 `wake` 方法。

当实现一个 `Future` 时，很关键的一点就是要假设每次 `poll` 调用都会应用到一个不同的 `Waker` 实例上。因此 `poll` 函数必须要使用一个新的 `waker` 去更新替代之前的 `waker`。

我们之前的 `Delay` 实现中，会在每一次 `poll` 调用时都生成一个新的线程。这么做问题不大，但是当 `poll` 调用较多时会出现明显的性能问题！一个解决方法就是记录你是否已经生成了一个线程，然后只有在没有生成时才去创建一个新的线程。但是一旦这么做，就必须确保线程的 `Waker` 在后续 `poll` 调用中被正确更新，否则你无法唤醒最近的 `Waker` ！

这一段大家可能会看得云里雾里的，没办法，原文就饶来绕去，好在终于可以看代码了。。我们可以通过代码来解决疑惑：

```rust
use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll, Waker};
use std::thread;
use std::time::{Duration, Instant};

struct Delay {
    when: Instant,
    // 用于说明是否已经生成一个线程
    // Some 代表已经生成， None 代表还没有
    waker: Option<Arc<Mutex<Waker>>>,
}

impl Future for Delay {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        // 若这是 Future 第一次被调用，那么需要先生成一个计时器线程。
        // 若不是第一次调用(该线程已在运行)，那要确保已存储的 `Waker` 跟当前任务的 `waker` 匹配
        if let Some(waker) = &self.waker {
            let mut waker = waker.lock().unwrap();

            // 检查之前存储的 `waker` 是否跟当前任务的 `waker` 相匹配.
            // 这是必要的，原因是 `Delay Future` 的实例可能会在两次 `poll` 之间被转移到另一个任务中，然后
            // 存储的 waker 被该任务进行了更新。
            // 这种情况一旦发生，`Context` 包含的 `waker` 将不同于存储的 `waker`。
            // 因此我们必须对存储的 `waker` 进行更新
            if !waker.will_wake(cx.waker()) {
                *waker = cx.waker().clone();
            }
        } else {
            let when = self.when;
            let waker = Arc::new(Mutex::new(cx.waker().clone()));
            self.waker = Some(waker.clone());

            // 第一次调用 `poll`，生成计时器线程
            thread::spawn(move || {
                let now = Instant::now();

                if now < when {
                    thread::sleep(when - now);
                }

                // 计时结束，通过调用 `waker` 来通知执行器
                let waker = waker.lock().unwrap();
                waker.wake_by_ref();
            });
        }

        // 一旦 waker 被存储且计时器线程已经开始，我们就需要检查 `delay` 是否已经完成
        // 若计时已完成，则当前 Future 就可以完成并返回 `Poll::Ready`
        if Instant::now() >= self.when {
            Poll::Ready(())
        } else {
            // 计时尚未结束，Future 还未完成，因此返回 `Poll::Pending`.
            //
            // `Future` 特征要求当 `Pending` 被返回时，那我们要确保当资源准备好时，必须调用 `waker` 以通
            // 知执行器。 在我们的例子中，会通过生成的计时线程来保证
            //
            // 如果忘记调用 waker， 那等待我们的将是深渊：该任务将被永远的挂起，无法再执行
            Poll::Pending
        }
    }
}
```

这着实有些复杂(原文。。)，但是简单来看就是：在每次 `poll` 调用时，都会检查 `Context` 中提供的 `waker` 和我们之前记录的 `waker` 是否匹配。若匹配，就什么都不用做，若不匹配，那之前存储的就必须进行更新。

#### Notify

我们之前证明了如何用手动编写的 `waker` 来实现 `Delay Future`。 `Waker` 是 Rust 异步编程的基石，因此绝大多数时候，我们并不需要直接去使用它。例如，在 `Delay` 的例子中， 可以使用 [`tokio::sync::Notify`](https://docs.rs/tokio/1.16.0/tokio/sync/struct.Notify.html) 去实现。

该 `Notify` 提供了一个基础的任务通知机制，它会处理这些 `waker` 的细节，包括确保两次 `waker` 的匹配:

```rust
use tokio::sync::Notify;
use std::sync::Arc;
use std::time::{Duration, Instant};
use std::thread;

async fn delay(dur: Duration) {
    let when = Instant::now() + dur;
    let notify = Arc::new(Notify::new());
    let notify2 = notify.clone();

    thread::spawn(move || {
        let now = Instant::now();

        if now < when {
            thread::sleep(when - now);
        }

        notify2.notify_one();
    });


    notify.notified().await;
}
```

当使用 `Notify` 后，我们就可以轻松的实现如上的 `delay` 函数。

## 总结

在看完这么长的文章后，我们来总结下，否则大家可能还会遗忘:

- 在 Rust 中，`async` 是惰性的，直到执行器 `poll` 它们时，才会开始执行
- `Waker` 是 `Future` 被执行的关键，它可以链接起 `Future` 任务和执行器
- 当资源没有准备时，会返回一个 `Poll::Pending`
- 当资源准备好时，会通过 `waker.wake` 发出通知
- 执行器会收到通知，然后调度该任务继续执行，此时由于资源已经准备好，因此任务可以顺利往前推进了

# select!

在实际使用时，一个重要的场景就是同时等待多个异步操作的结果，并且对其结果进行进一步处理，在本章节，我们来看看，强大的 `select!` 是如何帮助咱们更好的控制多个异步操作并发执行的。

## tokio::select!

`select!` 允许同时等待多个计算操作，然后当其中一个操作完成时就退出等待:

```rust
use tokio::sync::oneshot;

#[tokio::main]
async fn main() {
    let (tx1, rx1) = oneshot::channel();
    let (tx2, rx2) = oneshot::channel();

    tokio::spawn(async {
        let _ = tx1.send("one");
    });

    tokio::spawn(async {
        let _ = tx2.send("two");
    });

    tokio::select! {
        val = rx1 => {
            println!("rx1 completed first with {:?}", val);
        }
        val = rx2 => {
            println!("rx2 completed first with {:?}", val);
        }
    }

    // 任何一个 select 分支结束后，都会继续执行接下来的代码
}
```

这里用到了两个 `oneshot` 消息通道，虽然两个操作的创建在代码上有先后顺序，但在实际执行时却不这样。因此， `select` 在从两个通道**阻塞等待**接收消息时，`rx1` 和 `rx2` 都有可能被先打印出来。

需要注意，任何一个 `select` 分支完成后，都会继续执行后面的代码，没被执行的分支会被丢弃( `dropped` )。

#### 取消

对于 `Async Rust` 来说，释放( drop )掉一个 `Future` 就意味着取消任务。从上一章节可以得知， `async` 操作会返回一个 `Future`，而后者是惰性的，直到被 `poll` 调用时，才会被执行。一旦 `Future` 被释放，那操作将无法继续，因为所有相关的状态都被释放。

对于 Tokio 的 `oneshot` 的接收端来说，它在被释放时会发送一个关闭通知到发送端，因此发送端可以通过释放任务的方式来终止正在执行的任务。

```rust
use tokio::sync::oneshot;

async fn some_operation() -> String {
    // 在这里执行一些操作...
}

#[tokio::main]
async fn main() {
    let (mut tx1, rx1) = oneshot::channel();
    let (tx2, rx2) = oneshot::channel();

    tokio::spawn(async {
        // 等待 `some_operation` 的完成
        // 或者处理 `oneshot` 的关闭通知
        tokio::select! {
            val = some_operation() => {
                let _ = tx1.send(val);
            }
            _ = tx1.closed() => {
                // 收到了发送端发来的关闭信号
                // `select` 即将结束，此时，正在进行的 `some_operation()` 任务会被取消，任务自动完成，
                // tx1 被释放
            }
        }
    });

    tokio::spawn(async {
        let _ = tx2.send("two");
    });

    tokio::select! {
        val = rx1 => {
            println!("rx1 completed first with {:?}", val);
        }
        val = rx2 => {
            println!("rx2 completed first with {:?}", val);
        }
    }
}
```

上面代码的重点就在于 `tx1.closed` 所在的分支，一旦发送端被关闭，那该分支就会被执行，然后 `select` 会退出，并清理掉还没执行的第一个分支 `val = some_operation()` ，这其中 `some_operation` 返回的 `Future` 也会被清理，根据之前的内容，`Future` 被清理那相应的任务会立即取消，因此 `some_operation` 会被取消，不再执行。

#### Future 的实现

为了更好的理解 `select` 的工作原理，我们来看看如果使用 `Future` 该如何实现。当然，这里是一个简化版本，在实际中，`select!` 会包含一些额外的功能，例如一开始会随机选择一个分支进行 `poll`。

```rust
use tokio::sync::oneshot;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct MySelect {
    rx1: oneshot::Receiver<&'static str>,
    rx2: oneshot::Receiver<&'static str>,
}

impl Future for MySelect {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        if let Poll::Ready(val) = Pin::new(&mut self.rx1).poll(cx) {
            println!("rx1 completed first with {:?}", val);
            return Poll::Ready(());
        }

        if let Poll::Ready(val) = Pin::new(&mut self.rx2).poll(cx) {
            println!("rx2 completed first with {:?}", val);
            return Poll::Ready(());
        }

        Poll::Pending
    }
}

#[tokio::main]
async fn main() {
    let (tx1, rx1) = oneshot::channel();
    let (tx2, rx2) = oneshot::channel();

    // 使用 tx1 和 tx2

    MySelect {
        rx1,
        rx2,
    }.await;
}
```

`MySelect` 包含了两个分支中的 `Future`，当它被 `poll` 时，第一个分支会先执行。如果执行完成，那取出的值会被使用，然后 `MySelect` 也随之结束。而另一个分支对应的 `Future` 会被释放掉，对应的操作也会被取消。

还记得上一章节中很重要的一段话吗？

> 当一个 `Future` 返回 `Poll::Pending` 时，它必须确保会在某一个时刻通过 `Waker` 来唤醒，不然该 `Future` 将永远地被挂起

但是仔细观察我们之前的代码，里面并没有任何的 `wake` 调用！事实上，这是因为参数 `cx` 被传入了内层的 `poll` 调用。 只要内部的 `Future` 实现了唤醒并且返回了 `Poll::Pending`，那 `MySelect` 也等于实现了唤醒！

## 语法

目前来说，`select!` 最多可以支持 64 个分支，每个分支形式如下：

```rust
<模式> = <async 表达式> => <结果处理>,
```

当 `select` 宏开始执行后，所有的分支会开始并发的执行。当任何一个**表达式**完成时，会将结果跟**模式**进行匹配。若匹配成功，则剩下的表达式会被释放。

最常用的**模式**就是用变量名去匹配表达式返回的值，然后该变量就可以在**结果处理**环节使用。

如果当前的模式不能匹配，剩余的 `async` 表达式将继续并发的执行，直到下一个完成。

由于 `select!` 使用的是一个 `async` 表达式，因此我们可以定义一些更复杂的计算。

例如从在分支中进行 TCP 连接：

```rust
use tokio::net::TcpStream;
use tokio::sync::oneshot;

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel();

    // 生成一个任务，用于向 oneshot 发送一条消息
    tokio::spawn(async move {
        tx.send("done").unwrap();
    });

    tokio::select! {
        socket = TcpStream::connect("localhost:3465") => {
            println!("Socket connected {:?}", socket);
        }
        msg = rx => {
            println!("received message first {:?}", msg);
        }
    }
}
```

再比如，在分支中进行 TCP 监听:

```rust
use tokio::net::TcpListener;
use tokio::sync::oneshot;
use std::io;

#[tokio::main]
async fn main() -> io::Result<()> {
    let (tx, rx) = oneshot::channel();

    tokio::spawn(async move {
        tx.send(()).unwrap();
    });

    let mut listener = TcpListener::bind("localhost:3465").await?;

    tokio::select! {
        _ = async {
            loop {
                let (socket, _) = listener.accept().await?;
                tokio::spawn(async move { process(socket) });
            }

            // 给予 Rust 类型暗示
            Ok::<_, io::Error>(())
        } => {}
        _ = rx => {
            println!("terminating accept loop");
        }
    }

    Ok(())
}
```

分支中接收连接的循环会一直运行，直到遇到错误才停止，或者当 `rx` 中有值时，也会停止。 `_` 表示我们并不关心这个值，这样使用唯一的目的就是为了结束第一分支中的循环。

## 返回值

`select!` 还能返回一个值:

```rust
async fn computation1() -> String {
    // .. 计算
}

async fn computation2() -> String {
    // .. 计算
}

#[tokio::main]
async fn main() {
    let out = tokio::select! {
        res1 = computation1() => res1,
        res2 = computation2() => res2,
    };

    println!("Got = {}", out);
}
```

需要注意的是，此时 `select!` 的所有分支必须返回一样的类型，否则编译器会报错！

## 错误传播

在 Rust 中使用 `?` 可以对错误进行传播，但是在 `select!` 中，`?` 如何工作取决于它是在分支中的 `async` 表达式使用还是在结果处理的代码中使用:

- 在分支中 `async` 表达式使用会将该表达式的结果变成一个 `Result`
- 在结果处理中使用，会将错误直接传播到 `select!` 之外

```rust
use tokio::net::TcpListener;
use tokio::sync::oneshot;
use std::io;

#[tokio::main]
async fn main() -> io::Result<()> {
    // [设置 `rx` oneshot 消息通道]

    let listener = TcpListener::bind("localhost:3465").await?;

    tokio::select! {
        res = async {
            loop {
                let (socket, _) = listener.accept().await?;
                tokio::spawn(async move { process(socket) });
            }

            Ok::<_, io::Error>(())
        } => {
            res?;
        }
        _ = rx => {
            println!("terminating accept loop");
        }
    }

    Ok(())
}
```

`listener.accept().await?` 是分支表达式中的 `?`，因此它会将表达式的返回值变成 `Result` 类型，然后赋予给 `res` 变量。

与之不同的是，结果处理中的 `res?;` 会让 `main` 函数直接结束并返回一个 `Result`，可以看出，这里 `?` 的用法跟我们平时的用法并无区别。

## 模式匹配

既然是模式匹配，我们需要再来回忆下 `select!` 的分支语法形式:

```rust
<模式> = <async 表达式> => <结果处理>,
```

迄今为止，我们只用了变量绑定的模式，事实上，[任何 Rust 模式](https://course.rs/basic/match-pattern/all-patterns.html)都可以在此处使用。

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx1, mut rx1) = mpsc::channel(128);
    let (mut tx2, mut rx2) = mpsc::channel(128);

    tokio::spawn(async move {
        // 用 tx1 和 tx2 干一些不为人知的事
    });

    tokio::select! {
        Some(v) = rx1.recv() => {
            println!("Got {:?} from rx1", v);
        }
        Some(v) = rx2.recv() => {
            println!("Got {:?} from rx2", v);
        }
        else => {
            println!("Both channels closed");
        }
    }
}
```

上面代码中，`rx` 通道关闭后，`recv()` 方法会返回一个 `None`，可以看到没有任何模式能够匹配这个 `None`，那为何不会报错？秘密就在于 `else` 上：当使用模式去匹配分支时，若之前的所有分支都无法被匹配，那 `else` 分支将被执行。

## 借用

当在 Tokio 中生成( spawn )任务时，其 async 语句块必须拥有其中数据的所有权。而 `select!` 并没有这个限制，它的每个分支表达式可以直接借用数据，然后进行并发操作。只要遵循 Rust 的借用规则，多个分支表达式可以不可变的借用同一个数据，或者在一个表达式可变的借用某个数据。

来看个例子，在这里我们同时向两个 TCP 目标发送同样的数据:

```rust
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;
use std::io;
use std::net::SocketAddr;

async fn race(
    data: &[u8],
    addr1: SocketAddr,
    addr2: SocketAddr
) -> io::Result<()> {
    tokio::select! {
        Ok(_) = async {
            let mut socket = TcpStream::connect(addr1).await?;
            socket.write_all(data).await?;
            Ok::<_, io::Error>(())
        } => {}
        Ok(_) = async {
            let mut socket = TcpStream::connect(addr2).await?;
            socket.write_all(data).await?;
            Ok::<_, io::Error>(())
        } => {}
        else => {}
    };

    Ok(())
}
```

这里其实有一个很有趣的题外话，由于 TCP 连接过程是在模式中发生的，因此当某一个连接过程失败后，它通过 `?` 返回的 `Err` 类型并无法匹配 `Ok`，因此另一个分支会继续被执行，继续连接。

如果你把连接过程放在了结果处理中，那连接失败会直接从 `race` 函数中返回，而不是继续执行另一个分支中的连接！

还有一个非常重要的点，**借用规则在分支表达式和结果处理中存在很大的不同**。例如上面代码中，我们在两个分支表达式中分别对 `data` 做了不可变借用，这当然 ok，但是若是两次可变借用，那编译器会立即进行报错。但是转折来了：当在结果处理中进行两次可变借用时，却不会报错，大家可以思考下为什么，提示下：思考下分支在执行完成后会发生什么？

```rust
use tokio::sync::oneshot;

#[tokio::main]
async fn main() {
    let (tx1, rx1) = oneshot::channel();
    let (tx2, rx2) = oneshot::channel();

    let mut out = String::new();

    tokio::spawn(async move {
    });

    tokio::select! {
        _ = rx1 => {
            out.push_str("rx1 completed");
        }
        _ = rx2 => {
            out.push_str("rx2 completed");
        }
    }

    println!("{}", out);
}
```

例如以上代码，就在两个分支的结果处理中分别进行了可变借用，并不会报错。原因就在于：`select!`会保证只有一个分支的结果处理会被运行，然后在运行结束后，另一个分支会被直接丢弃。

## 循环

来看看该如何在循环中使用 `select!`，顺便说一句，跟循环一起使用是最常见的使用方式。

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx1, mut rx1) = mpsc::channel(128);
    let (tx2, mut rx2) = mpsc::channel(128);
    let (tx3, mut rx3) = mpsc::channel(128);

    loop {
        let msg = tokio::select! {
            Some(msg) = rx1.recv() => msg,
            Some(msg) = rx2.recv() => msg,
            Some(msg) = rx3.recv() => msg,
            else => { break }
        };

        println!("Got {}", msg);
    }

    println!("All channels have been closed.");
}
```

在循环中使用 `select!` 最大的不同就是，当某一个分支执行完成后，`select!` 会继续循环等待并执行下一个分支，直到所有分支最终都完成，最终匹配到 `else` 分支，然后通过 `break` 跳出循环。

老生常谈的一句话：`select!` 中哪个分支先被执行是无法确定的，因此不要依赖于分支执行的顺序！想象一下，在异步编程场景，若 `select!` 按照分支的顺序来执行会如何：若 `rx1` 中总是有数据，那每次循环都只会去处理第一个分支，后面两个分支永远不会被执行。

#### 恢复之前的异步操作

```rust
async fn action() {
    // 一些异步逻辑
}

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = tokio::sync::mpsc::channel(128);

    let operation = action();
    tokio::pin!(operation);

    loop {
        tokio::select! {
            _ = &mut operation => break,
            Some(v) = rx.recv() => {
                if v % 2 == 0 {
                    break;
                }
            }
        }
    }
}
```

在上面代码中，我们没有直接在 `select!` 分支中调用 `action()` ，而是在 `loop` 循环外面先将 `action()` 赋值给 `operation`，因此 `operation` 是一个 `Future`。

**重点来了**，在 `select!` 循环中，我们使用了一个奇怪的语法 `&mut operation`，大家想象一下，如果不加 `&mut` 会如何？答案是，每一次循环调用的都是一次全新的 `action()`调用，但是当加了 `&mut operatoion` 后，每一次循环调用就变成了对同一次 `action()` 的调用。也就是我们实现了在每次循环中恢复了之前的异步操作！

`select!` 的另一个分支从消息通道收取消息，一旦收到值是偶数，就跳出循环，否则就继续循环。

还有一个就是我们使用了 `tokio::pin!`，具体的细节这里先不介绍，值得注意的点是：如果要在一个引用上使用 `.await`，那么引用的值就必须是不能移动的或者实现了 `Unpin`，关于 `Pin` 和 `Unpin` 可以参见[这里](https://course.rs/async/pin-unpin.html)。

一旦移除 `tokio::pin!` 所在行的代码，然后试图编译，就会获得以下错误:

```console
error[E0599]: no method named `poll` found for struct
     `std::pin::Pin<&mut &mut impl std::future::Future>`
     in the current scope
  --> src/main.rs:16:9
   |
16 | /         tokio::select! {
17 | |             _ = &mut operation => break,
18 | |             Some(v) = rx.recv() => {
19 | |                 if v % 2 == 0 {
...  |
22 | |             }
23 | |         }
   | |_________^ method not found in
   |             `std::pin::Pin<&mut &mut impl std::future::Future>`
   |
   = note: the method `poll` exists but the following trait bounds
            were not satisfied:
           `impl std::future::Future: std::marker::Unpin`
           which is required by
           `&mut impl std::future::Future: std::future::Future`
```

虽然我们已经学了很多关于 `Future` 的知识，但是这个错误依然不太好理解。但是它不难解决：当你试图在**一个引用上调用 `.await` 然后遇到了 `Future 未实现` 这种错误时**，往往只需要将对应的 `Future` 进行固定即可: ` tokio::pin!(operation);`。

#### 修改一个分支

下面一起来看一个稍微复杂一些的 `loop` 循环，首先，我们拥有：

- 一个消息通道可以传递 `i32` 类型的值
- 定义在 `i32` 值上的一个异步操作

想要实现的逻辑是：

- 在消息通道中等待一个偶数出现
- 使用该偶数作为输入来启动一个异步操作
- 等待异步操作完成，与此同时监听消息通道以获取更多的偶数
- 若在异步操作完成前一个新的偶数到来了，终止当前的异步操作，然后接着使用新的偶数开始异步操作

```rust
async fn action(input: Option<i32>) -> Option<String> {
    // 若 input（输入）是None，则返回 None
    // 事实上也可以这么写: `let i = input?;`
    let i = match input {
        Some(input) => input,
        None => return None,
    };

    // 这里定义一些逻辑
}

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = tokio::sync::mpsc::channel(128);

    let mut done = false;
    let operation = action(None);
    tokio::pin!(operation);

    tokio::spawn(async move {
        let _ = tx.send(1).await;
        let _ = tx.send(3).await;
        let _ = tx.send(2).await;
    });

    loop {
        tokio::select! {
            res = &mut operation, if !done => {
                done = true;

                if let Some(v) = res {
                    println!("GOT = {}", v);
                    return;
                }
            }
            Some(v) = rx.recv() => {
                if v % 2 == 0 {
                    // `.set` 是 `Pin` 上定义的方法
                    operation.set(action(Some(v)));
                    done = false;
                }
            }
        }
    }
}
```

当第一次循环开始时， 第一个分支会立即完成，因为 `operation` 的参数是 `None`。当第一个分支执行完成时，`done` 会变成 `true`，此时第一个分支的条件将无法被满足，开始执行第二个分支。

当第二个分支收到一个偶数时，`done` 会被修改为 `false`，且 `operation` 被设置了值。 此后再一次循环时，第一个分支会被执行，且 `operation` 返回一个 `Some(2)`，因此会触发 `return` ，最终结束循环并返回。

这段代码引入了一个新的语法: `if !done`，在解释之前，先看看去掉后会如何：

```console
thread 'main' panicked at '`async fn` resumed after completion', src/main.rs:1:55
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

```'`async fn` resumed after completion'``` 错误的含义是：`async fn` 异步函数在完成后，依然被恢复了(继续使用)。

回到例子中来，这个错误是由于 `operation` 在它已经调用完成后依然被使用。通常来说，当使用 `.await` 后，调用 `.await` 的值会被消耗掉，因此并不存在这个问题。但是在这例子中，我们在引用上调用 `.await`，因此之后该引用依然可以被使用。

为了避免这个问题，需要在第一个分支的 `operation` 完成后禁止再使用该分支。这里的 `done` 的引入就很好的解决了问题。对于 `select!` 来说 `if !done` 的语法被称为预条件( **precondition** )，该条件会在分支被 `.await` 执行前进行检查。

那大家肯定有疑问了，既然 `operation` 不能再被调用了，我们该如何在有偶数值时，再回到第一个分支对其进行调用呢？答案就是 `operation.set(action(Some(v)));`，该操作会重新使用新的参数设置 `operation`。

## spawn 和 select! 的一些不同

学到现在，相信大家对于 `tokio::spawn` 和 `select!` 已经非常熟悉，它们的共同点就是都可以并发的运行异步操作。
然而它们使用的策略大相径庭。

`tokio::spawn` 函数会启动新的任务来运行一个异步操作，每个任务都是一个独立的对象可以单独被 Tokio 调度运行，因此两个不同的任务的调度都是独立进行的，甚至于它们可能会运行在两个不同的操作系统线程上。鉴于此，生成的任务和生成的线程有一个相同的限制：不允许对外部环境中的值进行借用。

而 `select!` 宏就不一样了，它在同一个任务中并发运行所有的分支。正是因为这样，在同一个任务中，这些分支无法被同时运行。 `select!` 宏在单个任务中实现了多路复用的功能。



# Stream

大家有没有想过， Rust 中的迭代器在迭代时能否异步进行？若不可以，是不是有相应的解决方案？

以上的问题其实很重要，因为在实际场景中，迭代一个集合，然后异步的去执行是很常见的需求，好在 Tokio 为我们提供了 `stream`，我们可以在异步函数中对其进行迭代，甚至和迭代器 `Iterator` 一样，`stream` 还能使用适配器，例如 `map` ! Tokio 在 [`StreamExt`](https://docs.rs/tokio-stream/0.1.8/tokio_stream/trait.StreamExt.html) 特征上定义了常用的适配器。

要使用 `stream` ，目前还需要手动引入对应的包：

```rust
tokio-stream = "0.1"
```

> stream 没有放在 `tokio` 包的原因在于标准库中的 `Stream` 特征还没有稳定，一旦稳定后，`stream` 将移动到 `tokio` 中来

## 迭代

目前， Rust 语言还不支持异步的 `for` 循环，因此我们需要 `while let` 循环和 [`StreamExt::next()`](https://docs.rs/tokio-stream/0.1.8/tokio_stream/trait.StreamExt.html#method.next) 一起使用来实现迭代的目的:

```rust
use tokio_stream::StreamExt;

#[tokio::main]
async fn main() {
    let mut stream = tokio_stream::iter(&[1, 2, 3]);

    while let Some(v) = stream.next().await {
        println!("GOT = {:?}", v);
    }
}
```

和迭代器 `Iterator` 类似，`next()` 方法返回一个 `Option<T>`，其中 `T` 是从 `stream` 中获取的值的类型。若收到 `None` 则意味着 `stream` 迭代已经结束。

#### mini-redis 广播

下面我们来实现一个复杂一些的 mini-redis 客户端，完整代码见[这里](https://github.com/tokio-rs/website/blob/master/tutorial-code/streams/src/main.rs)。

在开始之前，首先启动一下完整的 mini-redis 服务器端：

```console
$ mini-redis-server
use tokio_stream::StreamExt;
use mini_redis::client;

async fn publish() -> mini_redis::Result<()> {
    let mut client = client::connect("127.0.0.1:6379").await?;

    // 发布一些数据
    client.publish("numbers", "1".into()).await?;
    client.publish("numbers", "two".into()).await?;
    client.publish("numbers", "3".into()).await?;
    client.publish("numbers", "four".into()).await?;
    client.publish("numbers", "five".into()).await?;
    client.publish("numbers", "6".into()).await?;
    Ok(())
}

async fn subscribe() -> mini_redis::Result<()> {
    let client = client::connect("127.0.0.1:6379").await?;
    let subscriber = client.subscribe(vec!["numbers".to_string()]).await?;
    let messages = subscriber.into_stream();

    tokio::pin!(messages);

    while let Some(msg) = messages.next().await {
        println!("got = {:?}", msg);
    }

    Ok(())
}

#[tokio::main]
async fn main() -> mini_redis::Result<()> {
    tokio::spawn(async {
        publish().await
    });

    subscribe().await?;

    println!("DONE");

    Ok(())
}
```

上面生成了一个异步任务专门用于发布消息到 min-redis 服务器端的 `numbers` 消息通道中。然后，在 `main` 中，我们订阅了 `numbers` 消息通道，并且打印从中接收到的消息。

还有几点值得注意的:

- [`into_stream`](https://docs.rs/mini-redis/0.4.1/mini_redis/client/struct.Subscriber.html#method.into_stream) 会将 `Subscriber` 变成一个 `stream`
- 在 `stream` 上调用 `next` 方法要求该 `stream` 被固定住([`pinned`](https://doc.rust-lang.org/std/pin/index.html))，因此需要调用 `tokio::pin!`

> 关于 Pin 的详细解读，可以阅读[这篇文章](https://course.rs/async/pin-unpin.html)

大家可以去掉 `pin!` 的调用，然后观察下报错，若以后你遇到这种错误，可以尝试使用下 `pin!`。

此时，可以运行下我们的客户端代码看看效果(别忘了先启动前面提到的 mini-redis 服务端):

```console
got = Ok(Message { channel: "numbers", content: b"1" })
got = Ok(Message { channel: "numbers", content: b"two" })
got = Ok(Message { channel: "numbers", content: b"3" })
got = Ok(Message { channel: "numbers", content: b"four" })
got = Ok(Message { channel: "numbers", content: b"five" })
got = Ok(Message { channel: "numbers", content: b"6" })
```

在了解了 `stream` 的基本用法后，我们再来看看如何使用适配器来扩展它。

## 适配器

在前面章节中，我们了解了迭代器有[两种适配器](https://course.rs/advance/functional-programing/iterator.html#消费者与适配器)：

- 迭代器适配器，会将一个迭代器转变成另一个迭代器，例如 `map`，`filter` 等
- 消费者适配器，会消费掉一个迭代器，最终生成一个值，例如 `collect` 可以将迭代器收集成一个集合

与迭代器类似，`stream` 也有适配器，例如一个 `stream` 适配器可以将一个 `stream` 转变成另一个 `stream` ，例如 `map`、`take` 和 `filter`。

在之前的客户端中，`subscribe` 订阅一直持续下去，直到程序被关闭。现在，让我们来升级下，让它在收到三条消息后就停止迭代，最终结束。

```rust
let messages = subscriber
    .into_stream()
    .take(3);
```

这里关键就在于 `take` 适配器，它会限制 `stream` 只能生成最多 `n` 条消息。运行下看看结果：

```console
got = Ok(Message { channel: "numbers", content: b"1" })
got = Ok(Message { channel: "numbers", content: b"two" })
got = Ok(Message { channel: "numbers", content: b"3" })
```

程序终于可以正常结束了。现在，让我们过滤 `stream` 中的消息，只保留数字类型的值:

```rust
let messages = subscriber
    .into_stream()
    .filter(|msg| match msg {
        Ok(msg) if msg.content.len() == 1 => true,
        _ => false,
    })
    .take(3);
```

运行后输出：

```console
got = Ok(Message { channel: "numbers", content: b"1" })
got = Ok(Message { channel: "numbers", content: b"3" })
got = Ok(Message { channel: "numbers", content: b"6" })
```

需要注意的是，适配器的顺序非常重要，`.filter(...).take(3)` 和 `.take(3).filter(...)` 的结果可能大相径庭，大家可以自己尝试下。

现在，还有一件事要做，咱们的消息被不太好看的 `Ok(...)` 所包裹，现在通过 `map` 适配器来简化下:

```rust
let messages = subscriber
    .into_stream()
    .filter(|msg| match msg {
        Ok(msg) if msg.content.len() == 1 => true,
        _ => false,
    })
    .map(|msg| msg.unwrap().content)
    .take(3);
```

注意到 `msg.unwrap` 了吗？大家可能会以为我们是出于示例的目的才这么用，实际上并不是，由于 `filter` 的先执行， `map` 中的 `msg` 只能是 `Ok(...)`，因此 `unwrap` 非常安全。

```console
got = b"1"
got = b"3"
got = b"6"
```

还有一点可以改进的地方：当 `filter` 和 `map` 一起使用时，你往往可以用一个统一的方法来实现 [`filter_map`](https://docs.rs/tokio-stream/0.1.8/tokio_stream/trait.StreamExt.html#method.filter_map)。

```rust
let messages = subscriber
    .into_stream()
    .filter_map(|msg| match msg {
        Ok(msg) if msg.content.len() == 1 => msg.unwrap().content,
        _ => None,
    })
    .take(3);
```

想要学习更多的适配器，可以看看 [`StreamExt`](https://docs.rs/tokio-stream/0.1.8/tokio_stream/trait.StreamExt.html) 特征。

## 实现 Stream 特征

如果大家还没忘记 `Future` 特征，那 `Stream` 特征相信你也会很快记住，因为它们非常类似：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Stream {
    type Item;

    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>
    ) -> Poll<Option<Self::Item>>;

    fn size_hint(&self) -> (usize, Option<usize>) {
        (0, None)
    }
}
```

`Stream::poll_next()` 函数跟 `Future::poll` 很相似，区别就是前者为了从 `stream` 收到多个值需要重复的进行调用。 就像在 [`深入async`](https://course.rs/tokio/async.html) 章节提到的那样，当一个 `stream` 没有做好返回一个值的准备时，它将返回一个 `Poll::Pending` ，同时将任务的 `waker` 进行注册。一旦 `stream` 准备好后， `waker` 将被调用。

通常来说，如果想要手动实现一个 `Stream`，需要组合 `Future` 和其它 `Stream`。下面，还记得在[`深入async`](https://course.rs/tokio/async.html) 中构建的 `Delay Future` 吗？现在让我们来更进一步，将它转换成一个 `stream`，每 10 毫秒生成一个值，总共生成 3 次:

```rust
use tokio_stream::Stream;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::Duration;

struct Interval {
    rem: usize,
    delay: Delay,
}

impl Stream for Interval {
    type Item = ();

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<Option<()>>
    {
        if self.rem == 0 {
            // 去除计时器实现
            return Poll::Ready(None);
        }

        match Pin::new(&mut self.delay).poll(cx) {
            Poll::Ready(_) => {
                let when = self.delay.when + Duration::from_millis(10);
                self.delay = Delay { when };
                self.rem -= 1;
                Poll::Ready(Some(()))
            }
            Poll::Pending => Poll::Pending,
        }
    }
}
```

#### async-stream

手动实现 `Stream` 特征实际上是相当麻烦的事，不幸地是，Rust 语言的 `async/await` 语法目前还不能用于定义 `stream`，虽然相关的工作已经在进行中。

作为替代方案，[`async-stream`](https://docs.rs/async-stream/latest/async_stream/) 包提供了一个 `stream!` 宏，它可以将一个输入转换成 `stream`，使用这个包，上面的代码可以这样实现：

```rust
use async_stream::stream;
use std::time::{Duration, Instant};

stream! {
    let mut when = Instant::now();
    for _ in 0..3 {
        let delay = Delay { when };
        delay.await;
        yield ();
        when += Duration::from_millis(10);
    }
}
```

嗯，看上去还是相当不错的，代码可读性大幅提升！

<!-- todo generators -->
是不是发现了一个关键字 `yield` ，他是用来配合生成器使用的。详见[原文](https://doc.rust-lang.org/beta/unstable-book/language-features/generators.html)

# 优雅的关闭

如果你的服务是一个小说阅读网站，那大概率用不到优雅关闭的，简单粗暴的关闭服务器，然后用户再次请求时获取一个错误就是了。但如果是一个 web 服务或数据库服务呢？当前的连接很可能在做着重要的事情，一旦关闭会导致数据的丢失甚至错误，此时，我们就需要优雅的关闭(graceful shutdown)了。

要让一个异步应用优雅的关闭往往需要做到 3 点：

- 找出合适的关闭时机
- 通知程序的每一个子部分开始关闭
- 在主线程等待各个部分的关闭结果

在本文的下面部分，我们一起来看看该如何做到这三点。如果想要进一步了解在真实项目中该如何使用，大家可以看看 mini-redis 的完整代码实现，特别是 [`src/server.rs`](https://github.com/tokio-rs/mini-redis/blob/master/src/server.rs) 和 [`src/shutdown.rs`](https://github.com/tokio-rs/mini-redis/blob/master/src/shutdown.rs)。

## 找出合适的关闭时机

一般来说，何时关闭是取决于应用自身的，但是一个常用的关闭准则就是当应用收到来自于操作系统的关闭信号时。例如通过 `ctrl + c` 来关闭正在运行的命令行程序。

为了检测来自操作系统的关闭信号，`Tokio` 提供了一个 `tokio::signal::ctrl_c` 函数，它将一直睡眠直到收到对应的信号:

```rust
use tokio::signal;

#[tokio::main]
async fn main() {
    // ... spawn application as separate task ...
    // 在一个单独的任务中处理应用逻辑

    match signal::ctrl_c().await {
        Ok(()) => {},
        Err(err) => {
            eprintln!("Unable to listen for shutdown signal: {}", err);
        },
    }

    //  发送关闭信号给应用所在的任务，然后等待
}
```

## 通知程序的每一个部分开始关闭

大家看到这个标题，不知道会想到用什么技术来解决问题，反正我首先想到的是，真的很像广播哎。。

事实上也是如此，最常见的通知程序各个部分关闭的方式就是使用一个广播消息通道。关于如何实现，其实也不复杂：应用中的每个任务都持有一个广播消息通道的接收端，当消息被广播到该通道时，每个任务都可以收到该消息，并关闭自己:

```rust
let next_frame = tokio::select! {
    res = self.connection.read_frame() => res?,
    _ = self.shutdown.recv() => {
        // 当收到关闭信号后，直接从 `select!` 返回，此时 `select!` 中的另一个分支会自动释放，其中的任务也会结束
        return Ok(());
    }
};
```

在 `mini-redis` 中，当收到关闭消息时，任务会立即结束，但在实际项目中，这种方式可能会过于理想，例如当我们向文件或数据库写入数据时，立刻终止任务可能会导致一些无法预料的错误，因此，在结束前做一些收尾工作会是非常好的选择。

除此之外，还有两点值得注意:

- 将广播消息通道作为结构体的一个字段是相当不错的选择, 例如[这个例子](https://github.com/tokio-rs/mini-redis/blob/master/src/shutdown.rs)
- 还可以使用 [`watch channel`](https://docs.rs/tokio/1.16.1/tokio/sync/watch/index.html) 实现同样的效果，与之前的方式相比，这两种方法并没有太大的区别

## 等待各个部分的结束

在之前章节，我们讲到过一个 [`mpsc`](https://docs.rs/tokio/1/tokio/sync/mpsc/index.html) 消息通道有一个重要特性：当所有发送端都 `drop` 时，消息通道会自动关闭，此时继续接收消息就会报错。

大家发现没？这个特性特别适合优雅关闭的场景：主线程持有消息通道的接收端，然后每个代码部分拿走一个发送端，当该部分结束时，就 `drop` 掉发送端，因此所有发送端被 `drop` 也就意味着所有的部分都已关闭，此时主线程的接收端就会收到错误，进而结束。

```rust
use tokio::sync::mpsc::{channel, Sender};
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let (send, mut recv) = channel(1);

    for i in 0..10 {
        tokio::spawn(some_operation(i, send.clone()));
    }

    // 等待各个任务的完成
    //
    // 我们需要 drop 自己的发送端，因为等下的 `recv()` 调用会阻塞, 如果不 `drop` ，那发送端就无法被全部关闭
    // `recv` 也将永远无法结束，这将陷入一个类似死锁的困境
    drop(send);

    // 当所有发送端都超出作用域被 `drop` 时 (当前的发送端并不是因为超出作用域被 `drop` 而是手动 `drop` 的)
    // `recv` 调用会返回一个错误
    let _ = recv.recv().await;
}

async fn some_operation(i: u64, _sender: Sender<()>) {
    sleep(Duration::from_millis(100 * i)).await;
    println!("Task {} shutting down.", i);

    // 发送端超出作用域，然后被 `drop`
}
```

关于忘记 `drop` 本身持有的发送端进而导致 bug 的问题，大家可以看看[这篇文章](https://course.rs/pitfalls/main-with-channel-blocked.html)。





# 异步跟同步共存

一些异步程序例如 tokio 指南 章节中的绝大多数例子，它们整个程序都是异步的，包括程序入口 `main` 函数：

```rust
#[tokio::main]
async fn main() {
    println!("Hello world");
}
```

在一些场景中，你可能只想在异步程序中运行一小部分同步代码，这种需求可以考虑下 [`spawn_blocking`](https://docs.rs/tokio/1.16.1/tokio/task/fn.spawn_blocking.html)。

但是在很多场景中，我们只想让程序的某一个部分成为异步的，也许是因为同步代码更好实现，又或许是同步代码可读性、兼容性都更好。例如一个 `GUI` 应用可能想要让 `UI` 相关的代码在主线程中，然后通过另一个线程使用 `tokio` 的运行时来处理一些异步任务。

因此本章节的目标很纯粹：如何在同步代码中使用一小部分异步代码。

## `#[tokio::main]` 的展开

在 Rust 中， `main` 函数不能是异步的，有同学肯定不愿意了，我们在之前章节..不对，就在开头，你还用到了 `async fn main` 的声明方式，怎么就不能异步了呢？

其实，`#[tokio::main]` 该宏仅仅是提供语法糖，目的是让大家可以更简单、更一致的去写异步代码，它会将你写下的`async fn main` 函数替换为：

```rust
fn main() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            println!("Hello world");
        })
}
```

注意到上面的 `block_on` 方法了嘛？在我们自己的同步代码中，可以使用它开启一个 `async/await` 世界。

## mini-redis 的同步接口

在下面，我们将一起构建一个同步的 `mini-redis` ，为了实现这一点，需要将 `Runtime` 对象存储起来，然后利用上面提到的 `block_on` 方法。

首先，创建一个文件 `src/blocking_client.rs`，然后使用下面代码将异步的 `Client` 结构体包裹起来:

```rust
use tokio::net::ToSocketAddrs;
use tokio::runtime::Runtime;

pub use crate::client::Message;

/// 建立到 redis 服务端的连接
pub struct BlockingClient {
    /// 之前实现的异步客户端 `Client`
    inner: crate::client::Client,

    /// 一个 `current_thread` 模式的 `tokio` 运行时，
    /// 使用阻塞的方式来执行异步客户端 `Client` 上的操作
    rt: Runtime,
}

pub fn connect<T: ToSocketAddrs>(addr: T) -> crate::Result<BlockingClient> {
    // 构建一个 tokio 运行时： Runtime
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;

    // 使用运行时来调用异步的连接方法
    let inner = rt.block_on(crate::client::connect(addr))?;

    Ok(BlockingClient { inner, rt })
}
```

在这里，我们使用了一个构造器函数用于在同步代码中执行异步的方法：使用 `Runtime` 上的 `block_on` 方法来执行一个异步方法并返回结果。

有一个很重要的点，就是我们还使用了 [`current_thread`](https://docs.rs/tokio/1.16.1/tokio/runtime/struct.Builder.html#method.new_current_thread) 模式的运行时。这个可不常见，原因是异步程序往往要利用多线程的威力来实现更高的吞吐性能，相对应的模式就是 [`multi_thread`](https://docs.rs/tokio/1.16.1/tokio/runtime/struct.Builder.html#method.new_multi_thread)，该模式会生成多个运行在后台的线程，它们可以高效的实现多个任务的同时并行处理。

但是对于我们的使用场景来说，在同一时间点只需要做一件事，无需并行处理，多个线程并不能帮助到任何事情，因此 `current_thread` 此时成为了最佳的选择。

在构建 `Runtime` 的过程中还有一个 [`enable_all`](https://docs.rs/tokio/1.16.1/tokio/runtime/struct.Builder.html#method.enable_all) 方法调用，它可以开启 `Tokio` 运行时提供的 IO 和定时器服务。

> 由于 `current_thread` 运行时并不生成新的线程，只是运行在已有的主线程上，因此只有当 `block_on` 被调用后，该运行时才能执行相应的操作。一旦 `block_on` 返回，那运行时上所有生成的任务将再次冻结，直到 `block_on` 的再次调用。
>
> 如果这种模式不符合使用场景的需求，那大家还是需要用 `multi_thread` 运行时来代替。事实上，在 tokio 之前的章节中，我们默认使用的就是 `multi_thread` 模式。

```rust
use bytes::Bytes;
use std::time::Duration;

impl BlockingClient {
    pub fn get(&mut self, key: &str) -> crate::Result<Option<Bytes>> {
        self.rt.block_on(self.inner.get(key))
    }

    pub fn set(&mut self, key: &str, value: Bytes) -> crate::Result<()> {
        self.rt.block_on(self.inner.set(key, value))
    }

    pub fn set_expires(
        &mut self,
        key: &str,
        value: Bytes,
        expiration: Duration,
    ) -> crate::Result<()> {
        self.rt.block_on(self.inner.set_expires(key, value, expiration))
    }

    pub fn publish(&mut self, channel: &str, message: Bytes) -> crate::Result<u64> {
        self.rt.block_on(self.inner.publish(channel, message))
    }
}
```

这代码看上去挺长，实际上很简单，通过 `block_on` 将异步形式的 `Client` 的方法变成同步调用的形式。例如 `BlockingClient` 的 `get` 方法实际上是对内部的异步 `get` 方法的同步调用。

与上面的平平无奇相比，下面的代码将更有趣，因为它将 `Client` 转变成一个 `Subscriber` 对象:

```rust
/// 下面的客户端可以进入 pub/sub (发布/订阅) 模式
///
/// 一旦客户端订阅了某个消息通道，那就只能执行 pub/sub 相关的命令。
/// 将`BlockingClient` 类型转换成 `BlockingSubscriber` 是为了防止非 `pub/sub` 方法被调用
pub struct BlockingSubscriber {
    /// 异步版本的 `Subscriber`
    inner: crate::client::Subscriber,

    /// 一个 `current_thread` 模式的 `tokio` 运行时，
    /// 使用阻塞的方式来执行异步客户端 `Client` 上的操作
    rt: Runtime,
}

impl BlockingClient {
    pub fn subscribe(self, channels: Vec<String>) -> crate::Result<BlockingSubscriber> {
        let subscriber = self.rt.block_on(self.inner.subscribe(channels))?;
        Ok(BlockingSubscriber {
            inner: subscriber,
            rt: self.rt,
        })
    }
}

impl BlockingSubscriber {
    pub fn get_subscribed(&self) -> &[String] {
        self.inner.get_subscribed()
    }

    pub fn next_message(&mut self) -> crate::Result<Option<Message>> {
        self.rt.block_on(self.inner.next_message())
    }

    pub fn subscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        self.rt.block_on(self.inner.subscribe(channels))
    }

    pub fn unsubscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        self.rt.block_on(self.inner.unsubscribe(channels))
    }
}
```

由上可知，`subscribe` 方法会使用运行时将一个异步的 `Client` 转变成一个异步的 `Subscriber`，此外，`Subscriber` 结构体有一个非异步的方法 `get_subscribed`，对于这种方法，只需直接调用即可，而无需使用运行时。

## 其它方法

上面介绍的是最简单的方法，但是，如果只有这一种， tokio 也不会如此大名鼎鼎。

#### runtime.spawn

可以通过 `Runtime` 的 `spawn` 方法来创建一个基于该运行时的后台任务：

```rust
use tokio::runtime::Builder;
use tokio::time::{sleep, Duration};

fn main() {
    let runtime = Builder::new_multi_thread()
        .worker_threads(1)
        .enable_all()
        .build()
        .unwrap();

    let mut handles = Vec::with_capacity(10);
    for i in 0..10 {
        handles.push(runtime.spawn(my_bg_task(i)));
    }

    // 在后台任务运行的同时做一些耗费时间的事情
    std::thread::sleep(Duration::from_millis(750));
    println!("Finished time-consuming task.");

    // 等待这些后台任务的完成
    for handle in handles {
        // `spawn` 方法返回一个 `JoinHandle`，它是一个 `Future`，因此可以通过  `block_on` 来等待它完成
        runtime.block_on(handle).unwrap();
    }
}

async fn my_bg_task(i: u64) {
    let millis = 1000 - 50 * i;
    println!("Task {} sleeping for {} ms.", i, millis);

    sleep(Duration::from_millis(millis)).await;

    println!("Task {} stopping.", i);
}
```

运行该程序，输出如下:

```console
Task 0 sleeping for 1000 ms.
Task 1 sleeping for 950 ms.
Task 2 sleeping for 900 ms.
Task 3 sleeping for 850 ms.
Task 4 sleeping for 800 ms.
Task 5 sleeping for 750 ms.
Task 6 sleeping for 700 ms.
Task 7 sleeping for 650 ms.
Task 8 sleeping for 600 ms.
Task 9 sleeping for 550 ms.
Task 9 stopping.
Task 8 stopping.
Task 7 stopping.
Task 6 stopping.
Finished time-consuming task.
Task 5 stopping.
Task 4 stopping.
Task 3 stopping.
Task 2 stopping.
Task 1 stopping.
Task 0 stopping.
```

在此例中，我们生成了 10 个后台任务在运行时中运行，然后等待它们的完成。作为一个例子，想象一下在图形渲染应用( GUI )中，有时候需要通过网络访问远程服务来获取一些数据，那上面的这种模式就非常适合，因为这些网络访问比较耗时，而且不会影响图形的主体渲染，因此可以在主线程中渲染图形，然后使用其它线程来运行 Tokio 的运行时，并通过该运行时使用异步的方式完成网络访问，最后将这些网络访问的结果发送到 GUI 进行数据渲染，例如一个进度条。

还有一点很重要，在本例子中只能使用 `multi_thread` 运行时。如果我们使用了 `current_thread`，你会发现主线程的耗时任务会在后台任务开始之前就完成了。因为在 `current_thread` 模式下，生成的任务只会在 `block_on` 期间才执行。

在 `multi_thread` 模式下，我们并不需要通过 `block_on` 来触发任务的运行，这里仅仅是用来阻塞并等待最终的结果。而除了通过 `block_on` 等待结果外，你还可以：

- 使用消息传递的方式，例如 `tokio::sync::mpsc`，让异步任务将结果发送到主线程，然后主线程通过 `.recv`方法等待这些结果
- 通过共享变量的方式，例如 `Mutex`，这种方式非常适合实现 GUI 的进度条: GUI 在每个渲染帧读取该变量即可。

#### 发送消息

在同步代码中使用异步的另一个方法就是生成一个运行时，然后使用消息传递的方式跟它进行交互。这个方法虽然更啰嗦一些，但是相对于之前的两种方法更加灵活：

```rust
use tokio::runtime::Builder;
use tokio::sync::mpsc;

pub struct Task {
    name: String,
    // 一些信息用于描述该任务
}

async fn handle_task(task: Task) {
    println!("Got task {}", task.name);
}

#[derive(Clone)]
pub struct TaskSpawner {
    spawn: mpsc::Sender<Task>,
}

impl TaskSpawner {
    pub fn new() -> TaskSpawner {
        // 创建一个消息通道用于通信
        let (send, mut recv) = mpsc::channel(16);

        let rt = Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();

        std::thread::spawn(move || {
            rt.block_on(async move {
                while let Some(task) = recv.recv().await {
                    tokio::spawn(handle_task(task));
                }

                // 一旦所有的发送端超出作用域被 drop 后，`.recv()` 方法会返回 None，同时 while 循环会退出，然后线程结束
            });
        });

        TaskSpawner {
            spawn: send,
        }
    }

    pub fn spawn_task(&self, task: Task) {
        match self.spawn.blocking_send(task) {
            Ok(()) => {},
            Err(_) => panic!("The shared runtime has shut down."),
        }
    }
}
```

为何说这种方法比较灵活呢？以上面代码为例，它可以在很多方面进行配置。例如，可以使用信号量 [`Semaphore`](https://docs.rs/tokio/1.16.1/tokio/sync/struct.Semaphore.html)来限制当前正在进行的任务数，或者你还可以使用一个消息通道将消息反向发送回任务生成器 `spawner`。

抛开细节，抽象来看，这是不是很像一个 Actor ？



# Rust 难点攻关

当大家一路看到这里时，我敢说 90% 的人还是云里雾里的，例如你能说清楚:

- 切片和切片引用的区别吗？
- 各种字符串之间的区别吗？
- 各种指针、引用的区别吗？
- 所有权转移、拷贝、克隆的区别吗？

以及到底该用它们之中哪一个吗？

如果不行，就跟随我一起来看看吧，本章的目标就是帮大家彻底理清这些概念，为后面的进一步学习和实战打好坚实的基础。



# 切片和切片引用

关于 `str` / `&str`，`[u8]` / `&[u8]` 区别，你能清晰的说出来嘛？如果答案是 No ，那就跟随我一起来看看切片和切片引用到底有何区别吧。

> 在继续之前，查看[这里](https://course.rs/basic/compound-type/string-slice.html#切片slice)了解何为切片

切片允许我们引用集合中部分连续的元素序列，而不是引用整个集合。例如，字符串切片就是一个子字符串，数组切片就是一个子数组。

## 无法被直接使用的切片类型

Rust 语言特性内置的 **`str` 和 `[u8]` 类型都是切片**，前者是字符串切片，后者是数组切片，下面我们来尝试下使用 `str` ：

```rust
let string: str = "banana";
```

上面代码创建一个 `str` 类型的字符串，看起来很正常，但是编译就会报错：

```shell
error[E0277]: the size for values of type `str` cannot be known at compilation time
 --> src/main.rs:4:9
  |
4 |     let string: str = "banana";
  |         ^^^^^^ doesn't have a size known at compile-time
```

编译器准确的告诉了我们原因：`str` 字符串切片它是 [`DST` 动态大小类型](https://course.rs/advance/into-types/sized.html#动态大小类型-dst)，这意味着编译器无法在编译期知道 `str` 类型的大小，只有到了运行期才能动态获知，这对于强类型、强安全的 Rust 语言来说是不可接受的。

也就是说，我们无法直接使用 `str`，而对于 `[u8]` 也是类似的，大家可以自己动手试试。

总之，我们可以总结出一个结论：**在 Rust 中，所有的切片都是动态大小类型，它们都无法直接被使用**。

#### 为何切片是动态大小类型

原因在于底层的切片长度是可以动态变化的，而编译器无法在编译期得知它的具体的长度，因此该类型无法被分配在栈上，只能分配在堆上。

#### 为何切片只能通过引用来使用

既然切片只能分配到堆上，我们就无法直接使用它，大家可以想想，所有分配在堆上的数据，是不是都是通过一个在栈上的引用来访问的？切片也不例外。

#### 为何切片引用可以存储在栈上

切片引用是一个宽指针，存储在栈上，指向了堆上的切片数据，该引用包含了切片的起始位置和长度，而且最重要的是，类似于指针，引用的大小是固定的(起始位置和长度都是整形)，因此它才可以存储在栈上。

#### 有没有可以存储在栈上的

有，使用固定长度的数组: `let a: [i8;4] = [1,2,3,4];`，注意看，数组的类型与切片是不同的，前者的类型带有长度：`[i8;4]`，而后者仅仅是 `[i8]`。

## 切片引用

那么问题来了，该如何使用切片呢？

何以解忧，唯有引用。由于引用类型的大小在编译期是已知的，因此在 Rust 中，如果要使用切片，就必须要使用它的引用。

`str` 切片的引用类型是 `&str`，而 `[i32]` 的引用类型是 `&[i32]`，相信聪明的读者已经看出来了，`&str` 和 `&[i32]` 都是我们非常常用的类型，例如:

```rust
let s1: &str = "banana";
let s2: &str = &String::from("banana");

let arr = [1, 2, 3, 4, 5];

let s3: &[i32] = &arr[1..3];
```

这段代码就可以正常通过，原因在于这些切片引用的大小在编译器都是已知的。

## 总结

我们常常说使用切片，实际上我们在用的是切片的引用，我们也在频繁说使用字符串，实际上我们在使用的也是字符串切片的引用。

总之，切片在 Rust 中是动态大小类型 DST，是无法被我们直接使用的，而我们在使用的都是切片的引用。

| 切片           | 切片引用              |
| -------------- | --------------------- |
| str 字符串切片 | &str 字符串切片的引用 |
| [u8] 数组切片  | &[u8] 数组切片的引用  |

**但是出于方便，我们往往不会说使用切片引用，而是直接说使用字符串切片或数组切片，实际上，这时指代的都是切片的引用！**





# Eq 和 PartialEq
在 Rust 中，想要重载操作符，你就需要实现对应的特征。

例如 `<`、`<=`、`>` 和 `>=` 需要实现 `PartialOrd` 特征:
```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

再比如， `+` 号需要实现 `std::ops::Add` 特征，而本文的主角 `Eq` 和 `PartialEq` 正是 `==` 和 `!=` 所需的特征，那么问题来了，这两个特征有何区别？

我相信很多同学都说不太清楚，包括一些老司机，而且就算是翻文档，可能也找不到特别明确的解释。如果大家看过标准库示例，可能会看过这个例子：
```rust
enum BookFormat { Paperback, Hardback, Ebook }
struct Book {
    isbn: i32,
    format: BookFormat,
}
impl PartialEq for Book {
    fn eq(&self, other: &Self) -> bool {
        self.isbn == other.isbn
    }
}
impl Eq for Book {}
```

这里只实现了 `PartialEq`，并没有实现 `Eq`，而是直接使用了默认实现 `impl Eq for Book {}`，奇了怪了，别急，还有呢：
```rust
impl PartialEq<IpAddr> for Ipv4Addr {
    #[inline]
    fn eq(&self, other: &IpAddr) -> bool {
        match other {
            IpAddr::V4(v4) => self == v4,
            IpAddr::V6(_) => false,
        }
    }
}

impl Eq for Ipv4Addr {}
```

以上代码来自 Rust 标准库，可以看到，依然是这样使用，类似的情况数不胜数。既然如此，是否说明**如果要为我们的类型增加相等性比较，只要实现 `PartialEq` 即可？**

其实，关键点就在于 `partial` 上，**如果我们的类型只在部分情况下具有相等性**，那你就只能实现 `PartialEq`，否则可以实现 `PartialEq` 然后再默认实现 `Eq`。

好的，问题逐步清晰起来，现在我们只需要搞清楚何为部分相等。

### 部分相等性
首先我们需要找到一个类型，它实现了 `PartialEq` 但是没有实现 `Eq`（你可能会想有没有反过来的情况？当然没有啦，部分相等肯定是全部相等的子集！）

在 `HashMap` 章节提到过 `HashMap` 的 key 要求实现 `Eq` 特征，也就是要能完全相等，而浮点数由于没有实现 `Eq` ，因此不能用于 `HashMap` 的 key。

当时由于一些知识点还没有介绍，因此就没有进一步展开，那么让我们考虑浮点数既然没有实现 `Eq` 为何还能进行比较呢？
```rust
fn main() {
   let f1 = 3.14;
   let f2 = 3.14;

   if f1 == f2 {
       println!("hello, world!");
   }
}
```

以上代码是可以看到输出内容的，既然浮点数没有实现 `Eq` 那说明它实现了 `PartialEq`，一起写个简单代码验证下：
```rust
fn main() {
    let f1 = 3.14;
    is_eq(f1);
    is_partial_eq(f1)
}

fn is_eq<T: Eq>(f: T) {}
fn is_partial_eq<T: PartialEq>(f: T) {}
```

上面的代码通过特征约束的方式验证了我们的结论: 
```shell
3 |     is_eq(f1);
  |     ----- ^^ the trait `Eq` is not implemented for `{float}`
```

好的，既然我们成功找到了一个类型实现了 `PartialEq` 但没有实现 `Eq`，那就通过它来看看何为部分相等性。

其实答案很简单，浮点数有一个特殊的值 `NaN`，它是无法进行相等性比较的:
```rust
fn main() {
    let f1 = f32::NAN;
    let f2 = f32::NAN;

    if f1 == f2 {
        println!("NaN 竟然可以比较，这很不数学啊！")
    } else {
        println!("果然，虽然两个都是 NaN ，但是它们其实并不相等")
    }
}
```

大家猜猜哪一行会输出 :) 至于 `NaN` 为何不能比较，这个原因就比较复杂了( 有读者会说，其实就是你不知道，我只能义正严辞的说：咦？你怎么知道 :P )。

既然浮点数有一个值不可以比较相等性，那它自然只能实现 `PartialEq` 而不能实现 `Eq` 了，以此类推，如果我们的类型也有这种特殊要求，那也应该这么作。

### Ord 和 PartialOrd
事实上，还有一对与 `Eq/PartialEq` 非常类似的特征，它们可以用于 `<`、`<=`、`>` 和 `>=` 比较，至于哪个类型实现了 `PartialOrd` 却没有实现 `Ord` 就交给大家自己来思考了：）


> 小提示：Ord 意味着一个类型的所有值都可以进行排序，而 PartialOrd 则不然



# 疯狂字符串
字符串让人疯狂，这句话用在 Rust 中一点都不夸张，不信？那你能否清晰的说出 `String`、`str`、`&str`、`&String`、`Box<str>` 或 `Box<&str>` 的区别？

Rust 语言的类型可以大致分为两种：基本类型和标准库类型，前者是由语言特性直接提供的，而后者是在标准库中定义。即将登场的 **`str` 类型**就是唯一定义在语言特性中的字符串。

> 在继续之前，大家需要先了解字符串的[基本知识](https://course.rs/basic/compound-type/string-slice.html)，本文主要在于概念对比，而不是字符串讲解

## str
如上所述，`str` 是唯一定义在 Rust 语言特性中的字符串，但是也是我们几乎不会用到的字符串类型，为何？

原因在于 `str` 字符串它是 [`DST` 动态大小类型](https://course.rs/advance/into-types/sized.html#动态大小类型-dst)，这意味着编译器无法在编译期知道 `str` 类型的大小，只有到了运行期才能动态获知，这对于强类型、强安全的 Rust 语言来说是不可接受的。

```rust
let string: str = "banana";
```

上面代码创建一个 `str` 类型的字符串，看起来很正常，但是编译就会报错：
```shell
error[E0277]: the size for values of type `str` cannot be known at compilation time
 --> src/main.rs:4:9
  |
4 |     let string: str = "banana";
  |         ^^^^^^ doesn't have a size known at compile-time
```

如果追求更深层的原因，我们可以总结如下：**所有的切片都是动态类型，它们都无法直接被使用，而 `str` 就是字符串切片，`[u8]` 是数组切片。**


同时还是 String 和 &str 的底层数据类型。 由于 str 是动态

`str` 类型是硬编码进可执行文件，也无法被修改，但是 `String` 则是一个可增长、可改变且具有所有权的 UTF-8 编码字符串，**当 Rust 用户提到字符串时，往往指的就是 `String` 类型和 `&str` 字符串切片类型，这两个类型都是 UTF-8 编码**。

除了 `String` 类型的字符串，Rust 的标准库还提供了其他类型的字符串，例如 `OsString`， `OsStr`， `CsString` 和` CsStr` 等，注意到这些名字都以 `String` 或者 `Str` 结尾了吗？它们分别对应的是具有所有权和被借用的变量。
    



**未完待续**    

https://pic1.zhimg.com/80/v2-177bce575bfaf289ae12d677689a26f4_1440w.png
https://pic2.zhimg.com/80/v2-697ad53cb502ccec4b2e98c40975344f_1440w.png

https://medium.com/@alisomay/strings-in-rust-28c08a2d3130



# **作用域、生命周期和 NLL todo**





# **# move、Copy和Clone todo**



# **# 裸指针、引用和智能指针 todo**



<!-- https://blog.csdn.net/kk3909/article/details/106743025 -->





# **高级专题**

# [对抗编译检查](https://course.rs/compiler/fight-with-compiler/intro.html#对抗编译检查)

# [生命周期](https://course.rs/compiler/fight-with-compiler/lifetime/intro.html#生命周期)

本章并不讲太多的概念，主要是用例子来引导大家去思考该如何对抗编译检查。



# [生命周期声明的范围过大](https://course.rs/compiler/fight-with-compiler/lifetime/too-long1.html#生命周期声明的范围过大)

在大多时候，Rust 的生命周期你只要标识了，即可以通过编译，但是总是存在一些情况，会导致编译无法通过，本文就讲述这样一种情况：因为生命周期声明的范围过大，导致了编译无法通过，希望大家喜欢

## [例子 1](https://course.rs/compiler/fight-with-compiler/lifetime/too-long1.html#例子-1)

```rust
struct Interface<'a> {
    manager: &'a mut Manager<'a>
}

impl<'a> Interface<'a> {
    pub fn noop(self) {
        println!("interface consumed");
    }
}

struct Manager<'a> {
    text: &'a str
}

struct List<'a> {
    manager: Manager<'a>,
}

impl<'a> List<'a> {
    pub fn get_interface(&'a mut self) -> Interface {
        Interface {
            manager: &mut self.manager
        }
    }
}

fn main() {
    let mut list = List {
        manager: Manager {
            text: "hello"
        }
    };

    list.get_interface().noop();

    println!("Interface should be dropped here and the borrow released");

    // this fails because inmutable/mutable borrow
    // but Interface should be already dropped here and the borrow released
    use_list(&list);
}

fn use_list(list: &List) {
    println!("{}", list.manager.text);
}
```

运行后报错：

```console
error[E0502]: cannot borrow `list` as immutable because it is also borrowed as mutable // `list`无法被借用，因为已经被可变借用
  --> src/main.rs:40:14
   |
34 |     list.get_interface().noop();
   |     ---- mutable borrow occurs here // 可变借用发生在这里
...
40 |     use_list(&list);
   |              ^^^^^
   |              |
   |              immutable borrow occurs here // 新的不可变借用发生在这
   |              mutable borrow later used here // 可变借用在这里结束
```

这段代码看上去并不复杂，实际上难度挺高的，首先在直觉上，`list.get_interface()`借用的可变引用，按理来说应该在这行代码结束后，就归还了，为何能持续到`use_list(&list)`后面呢？

这是因为我们在`get_interface`方法中声明的`lifetime`有问题，该方法的参数的生明周期是`'a`，而`List`的生命周期也是`'a`，说明该方法至少活得跟`List`一样久，再回到`main`函数中，`list`可以活到`main`函数的结束，因此`list.get_interface()`借用的可变引用也会活到`main`函数的结束，在此期间，自然无法再进行借用了。

要解决这个问题，我们需要为`get_interface`方法的参数给予一个不同于`List<'a>`的生命周期`'b`，最终代码如下：

```rust
struct Interface<'b, 'a: 'b> {
    manager: &'b mut Manager<'a>
}

impl<'b, 'a: 'b> Interface<'b, 'a> {
    pub fn noop(self) {
        println!("interface consumed");
    }
}

struct Manager<'a> {
    text: &'a str
}

struct List<'a> {
    manager: Manager<'a>,
}

impl<'a> List<'a> {
    pub fn get_interface<'b>(&'b mut self) -> Interface<'b, 'a>
    where 'a: 'b {
        Interface {
            manager: &mut self.manager
        }
    }
}

fn main() {

    let mut list = List {
        manager: Manager {
            text: "hello"
        }
    };

    list.get_interface().noop();

    println!("Interface should be dropped here and the borrow released");

    // this fails because inmutable/mutable borrow
    // but Interface should be already dropped here and the borrow released
    use_list(&list);
}

fn use_list(list: &List) {
    println!("{}", list.manager.text);
}
```

当然，咱还可以给生命周期给予更有意义的名称：

```rust
struct Interface<'text, 'manager> {
    manager: &'manager mut Manager<'text>
}

impl<'text, 'manager> Interface<'text, 'manager> {
    pub fn noop(self) {
        println!("interface consumed");
    }
}

struct Manager<'text> {
    text: &'text str
}

struct List<'text> {
    manager: Manager<'text>,
}

impl<'text> List<'text> {
    pub fn get_interface<'manager>(&'manager mut self) -> Interface<'text, 'manager>
    where 'text: 'manager {
        Interface {
            manager: &mut self.manager
        }
    }
}

fn main() {
    let mut list = List {
        manager: Manager {
            text: "hello"
        }
    };

    list.get_interface().noop();

    println!("Interface should be dropped here and the borrow released");

    // this fails because inmutable/mutable borrow
    // but Interface should be already dropped here and the borrow released
    use_list(&list);
}

fn use_list(list: &List) {
    println!("{}", list.manager.text);
}
```



# [生命周期过大-02](https://course.rs/compiler/fight-with-compiler/lifetime/too-long2.html#生命周期过大-02)

继上篇文章后，我们再来看一段**可能**涉及生命周期过大导致的无法编译问题:

```rust
fn bar(writer: &mut Writer) {
    baz(writer.indent());
    writer.write("world");
}

fn baz(writer: &mut Writer) {
    writer.write("hello");
}

pub struct Writer<'a> {
    target: &'a mut String,
    indent: usize,
}

impl<'a> Writer<'a> {
    fn indent(&'a mut self) -> &'a mut Self {
        &mut Self {
            target: self.target,
            indent: self.indent + 1,
        }
    }

    fn write(&mut self, s: &str) {
        for _ in 0..self.indent {
            self.target.push(' ');
        }
        self.target.push_str(s);
        self.target.push('\n');
    }
}

fn main() {}
```

报错如下：

```console
error[E0623]: lifetime mismatch
 --> src/main.rs:2:16
  |
1 | fn bar(writer: &mut Writer) {
  |                -----------
  |                |
  |                these two types are declared with different lifetimes...
2 |     baz(writer.indent());
  |                ^^^^^^ ...but data from `writer` flows into `writer` here
```

WTF，这什么报错，之前都没有见过，而且很难理解，什么叫`writer`滑入了另一个`writer`？

别急，我们先来仔细看下代码，注意这一段：

```rust
impl<'a> Writer<'a> {
    fn indent(&'a mut self) -> &'a mut Self {
        &mut Self {
            target: self.target,
            indent: self.indent + 1,
        }
    }
```

这里的生命周期定义说明`indent`方法使用的。。。等等！你的代码错了，你怎么能在一个函数中返回一个新创建实例的引用？！！最重要的是，编译器不提示这个错误，竟然提示一个莫名其妙看不懂的东东。

行，那我们先解决这个问题，将该方法修改为:

```rust
fn indent(&'a mut self) -> Writer<'a> {
    Writer {
        target: self.target,
        indent: self.indent + 1,
    }
}
```

怀着惴惴这心，再一次运行程序，果不其然，编译器又朝我们扔了一坨错误：

```console
error[E0308]: mismatched types
 --> src/main.rs:2:9
  |
2 |     baz(writer.indent());
  |         ^^^^^^^^^^^^^^^
  |         |
  |         expected `&mut Writer<'_>`, found struct `Writer`
  |         help: consider mutably borrowing here: `&mut writer.indent()`
```

哦，这次错误很明显，因为`baz`需要`&mut Writer`，但是咱们`writer.indent`返回了一个`Writer`，因此修改下即可:

```rust
fn bar(writer: &mut Writer) {
    baz(&mut writer.indent());
    writer.write("world");
}
```

这次总该成功了吧？再次心慌慌的运行编译器，哐：

```console
error[E0623]: lifetime mismatch
 --> src/main.rs:2:21
  |
1 | fn bar(writer: &mut Writer) {
  |                -----------
  |                |
  |                these two types are declared with different lifetimes...
2 |     baz(&mut writer.indent());
  |                     ^^^^^^ ...but data from `writer` flows into `writer` here
```

可恶，还是这个看不懂的错误，仔细检查了下代码，这次真的没有其他错误了，只能硬着头皮上。

大概的意思可以分析，生命周期范围不匹配，说明一个大一个小，然后一个`writer`中流入到另一个`writer`说明，两个`writer`的生命周期定义错了，既然这里提到了`indent`方法调用，那么我们再去仔细看一眼：

```rust
impl<'a> Writer<'a> {
    fn indent(&'a mut self) -> Writer<'a> {
        Writer {
            target: self.target,
            indent: self.indent + 1,
        }
    }
    ...
}
```

好像有点问题，`indent`返回的`Writer`的生命周期和外面调用者的`Writer`的生命周期一模一样，这很不合理，一眼就能看出前者远小于后者。

这里稍微展开以下，为何`indent`方法返回值的生命周期不能与参数中的`self`相同。**首先，我们假设它们可以相同，也就是上面的代码可以编译通过**，由于此时在返回值中借用了`self`的可变引用，意味着**如果你在返回值被使用后，还继续使用`self` 会导致重复借用的错误，因为返回值的生命周期将持续到 `self` 结束**。

既然不能相同，那我们尝试着修改下`indent`:

```rust
 fn indent<'b>(&'b mut self) -> Writer<'b> {
    Writer {
        target: self.target,
        indent: self.indent + 1,
    }
}
```

Bang! 编译成功，不过稍等，回想下生命周期消除的规则，我们还可以实现的更优雅：

```rust
fn bar(writer: &mut Writer) {
    baz(&mut writer.indent());
    writer.write("world");
}

fn baz(writer: &mut Writer) {
    writer.write("hello");
}

pub struct Writer<'a> {
    target: &'a mut String,
    indent: usize,
}

impl<'a> Writer<'a> {
    fn indent(&mut self) -> Writer {
        Writer {
            target: self.target,
            indent: self.indent + 1,
        }
    }

    fn write(&mut self, s: &str) {
        for _ in 0..self.indent {
            self.target.push(' ');
        }
        self.target.push_str(s);
        self.target.push('\n');
    }
}

fn main() {}
```

至此，问题彻底解决，太好了，我感觉我又变强了。可是默默看了眼自己的头发，只能以`哎～`一声叹息结束本章内容。



# [蠢笨编译器之循环生命周期](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#蠢笨编译器之循环生命周期)

当涉及生命周期时，Rust 编译器有时会变得不太聪明，如果再配合循环，蠢笨都不足以形容它，不信？那继续跟着我一起看看。

## [循环中的生命周期错误](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#循环中的生命周期错误)

Talk is cheap, 一起来看个例子：

```rust
use rand::{thread_rng, Rng};

#[derive(Debug, PartialEq)]
enum Tile {
    Empty,
}

fn random_empty_tile(arr: &mut [Tile]) -> &mut Tile {
    loop {
        let i = thread_rng().gen_range(0..arr.len());
        let tile = &mut arr[i];
        if Tile::Empty == *tile{
            return tile;
        }
    }
}
```

我们来看看上面的代码中，`loop`循环有几个引用：

- `arr.len()`, 一个不可变引用，生命周期随着函数调用的结束而结束
- `tile`是可变引用，生命周期在下次循环开始前会结束

根据以上的分析，可以得出个初步结论：在同一次循环间各个引用生命周期互不影响，在两次循环间，引用也互不影响。

那就简单了，开心运行，开心。。。报错:

```console
error[E0502]: cannot borrow `*arr` as immutable because it is also borrowed as mutable
  --> src/main.rs:10:43
   |
8  | fn random_empty_tile(arr: &mut [Tile]) -> &mut Tile {
   |                           - let's call the lifetime of this reference `'1`
9  |     loop {
10 |         let i = thread_rng().gen_range(0..arr.len());
   |                                           ^^^ immutable borrow occurs here
11 |         let tile = &mut arr[i];
   |                    ----------- mutable borrow occurs here
12 |         if Tile::Empty == *tile{
13 |             return tile;
   |                    ---- returning this value requires that `arr[_]` is borrowed for `'1`

error[E0499]: cannot borrow `arr[_]` as mutable more than once at a time
  --> src/main.rs:11:20
   |
8  | fn random_empty_tile(arr: &mut [Tile]) -> &mut Tile {
   |                           - let's call the lifetime of this reference `'1`
...
11 |         let tile = &mut arr[i];
   |                    ^^^^^^^^^^^ `arr[_]` was mutably borrowed here in the previous iteration of the loop
12 |         if Tile::Empty == *tile{
13 |             return tile;
   |                    ---- returning this value requires that `arr[_]` is borrowed for `'1`
```

不仅是错误，还是史诗级别的错误！无情刷屏了！只能想办法梳理下：

1. `arr.len()`报错，原因是它借用了不可变引用，但是在紧跟着的`&mut arr[i]`中又借用了可变引用
2. `&mut arr[i]`报错，因为在上一次循环中，已经借用过同样的可变引用`&mut arr[i]`
3. `tile`的生命周期跟`arr`不一致

奇了怪了，跟我们之前的分析完全背道而驰，按理来说`arr.len()`的借用应该在调用后立刻结束，而不是持续到后面的代码行；同时可变借用`&mut arr[i]`也应该随着每次循环的结束而结束，为什么会前后两次循环会因为同一处的引用而报错？

## [尝试去掉中间变量](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#尝试去掉中间变量)

虽然报错复杂，不过可以看出，所有的错误都跟`tile`这个中间变量有关，我们试着移除它看看：

```rust
use rand::{thread_rng, Rng};

#[derive(Debug, PartialEq)]
enum Tile {
    Empty,
}

fn random_empty_tile(arr: &mut [Tile]) -> &mut Tile {
    loop {
        let i = thread_rng().gen_range(0..arr.len());
        if Tile::Empty == arr[i] {
            return &mut arr[i];
        }
    }
}
```

见证奇迹的时刻，竟然编译通过了！到底发什么了什么？仅仅移除了中间变量，就编译通过了？是否可以大胆的猜测，因为中间变量，导致编译器变蠢了，因此无法正确的识别引用的生命周期。

## [循环展开](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#循环展开)

如果不使用循环呢？会不会也有这样的错误？咱们试着把循环展开：

```rust
use rand::{thread_rng, Rng};

#[derive(Debug, PartialEq)]
enum Tile {
    Empty,
}

fn random_empty_tile_2<'arr>(arr: &'arr mut [Tile]) -> &'arr mut Tile {
    let len = arr.len();

    // First loop iteration
    {
        let i = thread_rng().gen_range(0..len);
        let tile = &mut arr[i]; // Lifetime: 'arr
        if Tile::Empty == *tile {
            return tile;
        }
    }

    // Second loop iteration
    {
        let i = thread_rng().gen_range(0..len);
        let tile = &mut arr[i]; // Lifetime: 'arr
         if Tile::Empty == *tile {
            return tile;
        }
    }

    unreachable!()
}
```

结果，编译器还是不给通过，报的错误几乎一样

## [深层原因](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#深层原因)

令人沮丧的是，我找遍了网上，也没有具体的原因，大家都说这是编译器太笨导致的问题，但是关于深层的原因，也没人能说出个所有然。

因此，我无法在本文中给出为什么编译器会这么笨的真实原因，如果以后有结果，会在这里进行更新。

------2022 年 1 月 13 日更新------- 兄弟们，我带着挖掘出的一些内容回来了，再来看段错误代码先：

```rust
struct A {
    a: i32
}

impl A {
    fn one(&mut self) -> &i32{
        self.a = 10;
        &self.a
    }
    fn two(&mut self) -> &i32 {
        loop {
            let k = self.one();
            if *k > 10i32 {
                return k;
            }

            // 可能存在的剩余代码
            // ...
        }
    }
}
```

我们来逐步深入分析下：

1. 首先为`two`方法增加一下生命周期标识: `fn two<'a>(&'a mut self) -> &'a i32 { .. }`, 这里根据生命周期的[消除规则](https://course.rs/advance/lifetime/basic.html#三条消除规则)添加的
2. 根据生命周期标识可知：`two`中返回的`k`的生命周期必须是`'a`
3. 根据第 2 条，又可知：`let k = self.one();`中对`self`的借用生命周期也是`'a`
4. 因为`k`的借用发生在`loop`循环内，因此它需要小于等于循环的生命周期，但是根据之前的推断，它又要大于等于函数的生命周期`'a`，而函数的生命周期又大于等于循环生命周期，

由上可以推出：`let k = self.one();`中`k`的生命周期要大于等于循环的生命周期，又要小于等于循环的生命周期, 唯一满足条件的就是：`k`的生命周期等于循环生命周期。

但是我们的`two`方法在循环中对`k`进行了提前返回，编译器自然会认为存在其它代码，这会导致`k`的生命周期小于循环的生命周期。

怎么办呢？很简单：

```rust
fn two(&mut self) -> &i32 {
    loop {
        let k = self.one();
        return k;
    }
}
```

不要在`if`分支中返回`k`，而是直接返回，这样就让它们的生命周期相等了，最终可以顺利编译通过。

> 如果一个引用值从函数的某个路径提前返回了，那么该借用必须要在函数的所有返回路径都合法

## [解决方法](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#解决方法)

虽然不能给出原因，但是我们可以看看解决办法，在上面，**移除中间变量**和**消除代码分支**都是可行的方法，还有一种方法就是将部分引用移到循环外面.

#### [引用外移](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#引用外移)

```rust
fn random_empty_tile(arr: &mut [Tile]) -> &mut Tile {
    let len = arr.len();
    let mut the_chosen_i = 0;
    loop {
        let i = rand::thread_rng().gen_range(0..len);
        let tile = &mut arr[i];
        if Tile::Empty == *tile {
            the_chosen_i = i;
            break;
        }
    }
    &mut arr[the_chosen_i]
}
```

在上面代码中，我们只在循环中保留一个可变引用，剩下的`arr.len`和返回值引用，都移到循环外面，顺利通过编译.

## [一个更复杂的例子](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#一个更复杂的例子)

再来看一个例子，代码会更复杂，但是原因几乎相同：

```rust
use std::collections::HashMap;

enum Symbol {
    A,
}

pub struct SymbolTable {
    scopes: Vec<Scope>,
    current: usize,
}

struct Scope {
    parent: Option<usize>,
    symbols: HashMap<String, Symbol>,
}

impl SymbolTable {
    pub fn get_mut(&mut self, name: &String) -> &mut Symbol {
        let mut current = Some(self.current);

        while let Some(id) = current {
            let scope = self.scopes.get_mut(id).unwrap();
            if let Some(symbol) = scope.symbols.get_mut(name) {
                return symbol;
            }

            current = scope.parent;
        }

        panic!("Value not found: {}", name);
    }
}
```

运行后报错如下：

```console
error[E0499]: cannot borrow `self.scopes` as mutable more than once at a time
  --> src/main.rs:22:25
   |
18 |     pub fn get_mut(&mut self, name: &String) -> &mut Symbol {
   |                    - let's call the lifetime of this reference `'1`
...
22 |             let scope = self.scopes.get_mut(id).unwrap();
   |                         ^^^^^^^^^^^ `self.scopes` was mutably borrowed here in the previous iteration of the loop
23 |             if let Some(symbol) = scope.symbols.get_mut(name) {
24 |                 return symbol;
   |                        ------ returning this value requires that `self.scopes` is borrowed for `'1`
```

对于上述代码，只需要将返回值修改下，即可通过编译：

```rust
fn get_mut(&mut self, name: &String) -> &mut Symbol {
    let mut current = Some(self.current);

    while let Some(id) = current {
        let scope = self.scopes.get_mut(id).unwrap();
        if scope.symbols.contains_key(name) {
            return self.scopes.get_mut(id).unwrap().symbols.get_mut(name).unwrap();
        }

        current = scope.parent;
    }

    panic!("Value not found: {}", name);
}
```

其中的关键就在于返回的时候，新建一个引用，而不是使用中间状态的引用。

## [新编译器 Polonius](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#新编译器-polonius)

针对现有编译器存在的各种问题，Rust 团队正在研发一个全新的编译器，名曰[`polonius`](https://github.com/rust-lang/polonius),但是目前它仍然处在开发阶段，如果想在自己项目中使用，需要在`rustc/RUSTFLAGS`中增加标志`-Zpolonius`，但是可能会导致编译速度变慢，或者引入一些新的编译错误。

## [总结](https://course.rs/compiler/fight-with-compiler/lifetime/loop.html#总结)

编译器不是万能的，它也会迷茫，也会犯错。

因此我们在循环中使用引用类型时要格外小心，特别是涉及可变引用，这种情况下，最好的办法就是避免中间状态，或者在返回时避免使用中间状态。



# [当闭包碰到特征对象 1](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#当闭包碰到特征对象-1)

特征对象是一个好东西，闭包也是一个好东西，但是如果两者你都想要时，可能就会火星撞地球，boom! 至于这两者为何会勾搭到一起？考虑一个常用场景：使用闭包作为回调函数.

## [学习目标](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#学习目标)

如何使用闭包作为特征对象，并解决以下错误：`the parameter type ``impl Fn(&str) -> Res` `may not live long enough`

## [报错的代码](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#报错的代码)

在下面代码中，我们通过闭包实现了一个简单的回调函数(错误代码已经标注)：

```rust
pub struct Res<'a> {
    value: &'a str,
}

impl<'a> Res<'a> {
    pub fn new(value: &str) -> Res {
        Res { value }
    }
}

pub struct Container<'a> {
    name: &'a str,
    callback: Option<Box<dyn Fn(&str) -> Res>>,
}

impl<'a> Container<'a> {
    pub fn new(name: &str) -> Container {
        Container {
            name,
            callback: None,
        }
    }

    pub fn set(&mut self, cb: impl Fn(&str) -> Res) {
        self.callback = Some(Box::new(cb));
    }
}

fn main() {
    let mut inl = Container::new("Inline");

    inl.set(|val| {
        println!("Inline: {}", val);
        Res::new("inline")
    });

    if let Some(cb) = inl.callback {
        cb("hello, world");
    }
}
error[E0310]: the parameter type `impl Fn(&str) -> Res` may not live long enough
  --> src/main.rs:25:30
   |
24 |     pub fn set(&mut self, cb: impl Fn(&str) -> Res) {
   |                               -------------------- help: consider adding an explicit lifetime bound...: `impl Fn(&str) -> Res + 'static`
25 |         self.callback = Some(Box::new(cb));
   |                              ^^^^^^^^^^^^ ...so that the type `impl Fn(&str) -> Res` will meet its required lifetime bounds
```

从第一感觉来说，报错属实不应该，因为我们连引用都没有用，生命周期都不涉及，怎么就报错了？在继续深入之前，先来观察下该闭包是如何被使用的：

```rust
callback: Option<Box<dyn Fn(&str) -> Res>>,
```

众所周知，闭包跟哈姆雷特一样，每一个都有[自己的类型](https://course.rs/advance/functional-programing/closure.html#闭包作为函数返回值)，因此我们无法通过类型标注的方式来声明一个闭包，那么只有一个办法，就是使用特征对象，因此上面代码中，通过`Box<dyn Trait>`的方式把闭包特征封装成一个特征对象。

## [深入挖掘报错原因](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#深入挖掘报错原因)

事出诡异必有妖，那接下来我们一起去会会这只妖。

#### [特征对象的生命周期](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#特征对象的生命周期)

首先编译器报错提示我们闭包活得不够久，那可以大胆推测，正因为使用了闭包作为特征对象，所以才活得不够久。因此首先需要调查下特征对象的生命周期。

首先给出结论：**特征对象隐式的具有`'static`生命周期**。

其实在 Rust 中，`'static`生命周期很常见，例如一个没有引用字段的结构体它其实也是`'static`。当`'static`用于一个类型时，该类型不能包含任何非`'static`引用字段，例如以下结构体：

```rust
struct Foo<'a> {
    x : &'a [u8]
};
```

除非`x`字段借用了`'static`的引用，否则`'a`肯定比`'static`要小，那么该结构体实例的生命周期肯定不是`'static`: `'a: 'static`的限制不会被满足([HRTB](https://course.rs/advance/lifetime/advance.html#生命周期约束HRTB))。

对于特征对象来说，它没有包含非`'static`的引用，因此它隐式的具有`'static`生命周期, `Box<dyn Trait>`就跟`Box<dyn Trait + 'static>`是等价的。

#### ['static 闭包的限制](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#static-闭包的限制)

其实以上代码的错误很好解决，甚至编译器也提示了我们：

```console
help: consider adding an explicit lifetime bound...: `impl Fn(&str) -> Res + 'static`
```

但是解决问题不是本文的目标，我们还是要继续深挖一下，如果闭包使用了`'static`会造成什么问题。

##### [1. 无本地变量被捕获](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#1-无本地变量被捕获)

```rust
inl.set(|val| {
    println!("Inline: {}", val);
    Res::new("inline")
});
```

以上代码只使用了闭包中传入的参数，并没有本地变量被捕获，因此`'static`闭包一切 OK。

##### [2. 有本地变量被捕获](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#2-有本地变量被捕获)

```rust
let local = "hello".to_string();

// 编译错误： 闭包不是'static!
inl.set(|val| {
    println!("Inline: {}", val);
    println!("{}", local);
    Res::new("inline")
});
```

这里我们在闭包中捕获了本地环境变量`local`，因为`local`不是`'static`，那么闭包也不再是`'static`。

##### [3. 将本地变量 move 进闭包](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#3-将本地变量-move-进闭包)

```rust
let local = "hello".to_string();

inl.set(move |val| {
    println!("Inline: {}", val);
    println!("{}", local);
    Res::new("inline")
});

// 编译错误: local已经被移动到闭包中，这里无法再被借用
// println!("{}", local);
```

如上所示，你也可以选择将本地变量的所有权`move`进闭包中，此时闭包再次具有`'static`生命周期

##### [4. 非要捕获本地变量的引用？](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#4-非要捕获本地变量的引用)

对于第 2 种情况，如果非要这么干，那`'static`肯定是没办法了，我们只能给予闭包一个新的生命周期:

```rust
pub struct Container<'a, 'b> {
    name: &'a str,
    callback: Option<Box<dyn Fn(&str) -> Res + 'b>>,
}

impl<'a, 'b> Container<'a, 'b> {
    pub fn new(name: &str) -> Container {
        Container {
            name,
            callback: None,
        }
    }

    pub fn set(&mut self, cb: impl Fn(&str) -> Res + 'b) {
        self.callback = Some(Box::new(cb));
    }
}
```

肉眼可见，代码复杂度哐哐哐提升，不得不说`'static`真香！

友情提示：由此修改引发的一系列错误，需要你自行修复: ) (再次友情小提示，可以考虑把`main`中的`local`变量声明位置挪到`inl`声明位置之前)

## [姗姗来迟的正确代码](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#姗姗来迟的正确代码)

其实，大家应该都知道该如何修改了，不过出于严谨，我们还是继续给出完整的正确代码:

```rust
pub fn set(&mut self, cb: impl Fn(&str) -> Res + 'static) {
```

可能大家觉得我重新定义了`完整`两个字，其实是我不想水篇幅:)

## [总结](https://course.rs/compiler/fight-with-compiler/lifetime/closure-with-static.html#总结)

闭包和特征对象的相爱相杀主要原因就在于特征对象默认具备`'static`的生命周期，同时我们还对什么样的类型具备`'static`进行了简单的分析。

同时，如果一个闭包拥有`'static`生命周期，那闭包无法通过引用的方式来捕获本地环境中的变量。如果你想要非要捕获，只能使用非`'static`。

# [重复借用](https://course.rs/compiler/fight-with-compiler/borrowing/intro.html#重复借用)

本章讲述如何解决类似`cannot borrow *self as mutable because it is also borrowed as immutable`这种重复借用的错误。

# [同时在函数内外使用引用导致的重复借用错误](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#同时在函数内外使用引用导致的重复借用错误)

本文将彻底解决一个困扰广大 Rust 用户已久的常见错误：因为在函数内外同时借用一个引用，导致了重复借用错误`cannot borrow *self as mutable because it is also borrowed as immutable`.

> 本文大部分内容节选自[Rust 常见陷阱](https://course.rs/pitfalls/index.html)专题，由于借用是新手绕不过去的坎，因此将其提取出来形成一个新的系列

## [正确的代码](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#正确的代码)

```rust
struct Test {
    a : u32,
    b : u32
}

impl Test {
    fn increase(&mut self) {
        let mut a = &mut self.a;
        let mut b = &mut self.b;
        *b += 1;
        *a += 1;
    }
}
```

这段代码是可以正常编译的，也许有读者会有疑问，`self`在这里被两个变量以可变的方式借用了，明明违反了 Rust 的所有权规则，为何它不会报错？

答案要从很久很久之前开始(啊哒~~~由于我太啰嗦，被正义群众来了一下，那咱现在开始长话短说，直接进入主题)。

#### [正确代码为何不报错？](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#正确代码为何不报错)

虽然从表面来看，`a`和`b`都可变引用了`self`，但是 Rust 的编译器在很多时候都足够聪明，它发现我们其实仅仅引用了同一个结构体中的不同字段，因此完全可以将其的借用权分离开来。

因此，虽然我们不能同时对整个结构体进行可变引用，但是我们可以分别对结构体中的不同字段进行可变引用，当然，一个字段至多也只能存在一个可变引用，这个最基本的所有权规则还是不能违反的。变量`a`引用结构体字段`a`，变量`b`引用结构体字段`b`，从底层来说，这种方式也不会造成两个可变引用指向了同一块内存。

至此，正确代码我们已经挖掘完毕，再来看看重构后的错误代码。

## [重构后的错误代码](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#重构后的错误代码)

```rust
struct Test {
    a : u32,
    b : u32
}

impl Test {

    fn increase_a (&mut self) {
        self.a += 1;
    }

    fn increase(&mut self) {
        let b = &mut self.b;
        self.increase_a();
        *b += 1;
    }
}
```

果然不正义的代码就是不好看，但是邪恶的它更强了吗？

```console
error[E0499]: cannot borrow `*self` as mutable more than once at a time
  --> src/main.rs:14:9
   |
13 |         let b = &mut self.b;
   |                 ----------- first mutable borrow occurs here
14 |         self.increase_a();
   |         ^^^^ second mutable borrow occurs here
15 |         *b += 1;
   |         ------- first borrow later used here
```

嗯，最开始提到的错误，它终于出现了。

## [大聪明编译器](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#大聪明编译器)

为什么？明明之前还是正确的代码，就因为放入函数中就报错了？我们先从一个简单的理解谈起，当然这个理解也是浮于表面的，等会会深入分析真实的原因。

之前讲到 Rust 编译器挺聪明，可以识别到引用到不同的结构体字段，因此不会报错。但是现在这种情况下，编译器又不够聪明了，一旦放入函数中，编译器将无法理解我们对`self`的使用：它仅仅用到了一个字段，而不是整个结构体。

因此它会简单的认为，这个结构体作为一个整体被可变借用了，产生两个可变引用，一个引用整个结构体，一个引用了结构体字段`b`，这两个引用存在重叠的部分，最终导致编译错误。

## [被冤枉的编译器](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#被冤枉的编译器)

在工作生活中，我们无法理解甚至错误的理解一件事，有时是因为层次不够导致的。同样，对于本文来说，也是因为我们对编译器的所知不够，才冤枉了它，还给它起了一个屈辱的“大聪明”外号。

#### [深入分析](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#深入分析)

> 如果只改变相关函数的实现而不改变它的签名，那么不会影响编译的结果

何为相关函数？当函数`a`调用了函数`b`，那么`b`就是`a`的相关函数。

上面这句是一条非常重要的编译准则，意思是，对于编译器来说，只要函数签名没有变，那么任何函数实现的修改都不会影响已有的编译结果(前提是函数实现没有错误- , -)。

以前面的代码为例：

```rust
fn increase_a (&mut self) {
    self.a += 1;
}

fn increase(&mut self) {
    let b = &mut self.b;
    self.increase_a();
    *b += 1;
}
```

虽然`increase_a`在函数实现中没有访问`self.b`字段，但是它的签名允许它访问`b`，因此违背了借用规则。事实上，该函数有没有访问`b`不重要，**因为编译器在这里只关心签名，签名存在可能性，那么就立刻报出错误**。

为何会有这种编译器行为，主要有两个原因：

1. 一般来说，我们希望编译器有能力独立的编译每个函数，而无需深入到相关函数的内部实现，因为这样做会带来快得多的编译速度。
2. 如果没有这种保证，那么在实际项目开发中，我们会特别容易遇到各种错误。 假设我们要求编译器不仅仅关注相关函数的签名，还要深入其内部关注实现，那么由于 Rust 严苛的编译规则，当你修改了某个函数内部实现的代码后，可能会引起使用该函数的其它函数的各种错误！对于大型项目来说，这几乎是不可接受的！

然后，我们的借用类型这么简单，编译器有没有可能针对这种场景，在现有的借用规则之外增加特殊规则？答案是否定的，由于 Rust 语言的设计哲学：特殊规则的加入需要慎之又慎，而我们的这种情况其实还蛮好解决的，因此编译器不会为此新增规则。

## [解决办法](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#解决办法)

在深入分析中，我们提到一条重要的规则，要影响编译行为，就需要更改相关函数的签名，因此可以修改`increase_a`的签名:

```rust
fn increase_a (a :&mut u32) {
    *a += 1;
}

fn increase(&mut self) {
    let b = &mut self.b;
    Test::increase_a(&mut self.a);
    *b += 1;
}
```

此时，`increase_a`这个相关函数，不再使用`&mut self`作为签名，而是获取了结构体中的字段`a`，此时编译器又可以清晰的知道：函数`increase_a`和变量`b`分别引用了结构体中的不同字段，因此可以编译通过。

当然，除了修改相关函数的签名，你还可以修改调用者的实现：

```rust
fn increase(&mut self) {
    self.increase_a();
    self.b += 1;
}
```

在这里，我们不再单独声明变量`b`，而是直接调用`self.b+=1`进行递增，根据借用生命周期[NLL](https://course.rs/advance/lifetime/advance.html#nllnon-lexical-lifetime)的规则，第一个可变借用`self.increase_a()`的生命周期随着方法调用的结束而结束，那么就不会影响`self.b += 1`中的借用。

## [CPU 模拟例子](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#cpu-模拟例子)

我们再来看一个例子:

```rust
use std::collections::HashMap;

struct Cpu {
    pc: u16,
    cycles: u32,
    opcodes: HashMap<u8, Opcode>,
}

struct Opcode {
    size: u16,
    cycles: u32,
}

impl Cpu {
    fn new() -> Cpu {
        Cpu {
            pc: 0,
            cycles: 0,
            opcodes: HashMap::from([
                (0x00, Opcode::new(1, 7)),
                (0x01, Opcode::new(2, 6))
            ]),
        }
    }

    fn tick(&mut self) {
        let address = self.pc as u8;
        let opcode = &self.opcodes[&address];

        step(&mut self, opcode);
    }


}

fn step(cpu : &mut Cpu, opcode: &Opcode) {

}

impl Opcode {
    fn new(size: u16, cycles: u32) -> Opcode {
        Opcode { size, cycles }
    }
}

fn main() {
    let mut cpu = Cpu::new();
    cpu.tick();
}
```

## [总结](https://course.rs/compiler/fight-with-compiler/borrowing/ref-exist-in-out-fn.html#总结)

知其然知其所以然，要彻底解决借用导致的编译错误，我们就必须深入了解其原理，心中有剑则手中无"贱"。

上面的例子就留给读者朋友自己去解决，相信你以后在遇到这种常见问题时，会更加游刃有余。



# [智能指针引起的重复借用错误](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#智能指针引起的重复借用错误)

本文将彻底解决一个困扰广大 Rust 用户已久的常见错误： 当智能指针和结构体一起使用时导致的借用错误: `cannot borrow`mut_s` as mutable because it is also borrowed as immutable`.

相信看过[<<对抗 Rust 编译检查系列>>](https://course.rs/fight-with-compiler/intro.html)的读者都知道结构体中的不同字段可以独立借用吧？

## [结构体中的字段借用](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#结构体中的字段借用)

不知道也没关系，我们这里再简单回顾一下:

```rust
struct Test {
    a : u32,
    b : u32
}

impl Test {
    fn increase(&mut self) {
        let mut a = &mut self.a;
        let mut b = &mut self.b;
        *b += 1;
        *a += 1;
    }
}
```

这段代码看上去像是重复借用了`&mut self`,违反了 Rust 的借用规则，实际上在聪明的 Rust 编译器面前，这都不是事。它能发现我们其实借用了目标结构体的不同字段，因此完全可以将其借用权分离开来。

因此，虽然我们不能同时对整个结构体进行多次可变借用，但是我们可以分别对结构体中的不同字段进行可变借用，当然，一个字段至多也只能存在一个可变借用，这个最基本的所有权规则还是不能违反的。变量`a`引用结构体字段`a`，变量`b`引用结构体字段`b`，从底层来说，这种方式也不会造成两个可变引用指向了同一块内存。

## [RefCell](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#refcell)

如果你还不知道 RefCell，可以看看[这篇文章](https://course.rs/advance/smart-pointer/cell-refcell.html)，当然不看也行，简而言之，RefCell 能够实现：

- 将借用规则从编译期推迟到运行期，但是并不会饶过借用规则，当不符合时，程序直接`panic`
- 实现内部可变性：简单来说，对一个不可变的值进行可变借用，然后修改内部的值

## [被 RefCell 包裹的结构体](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#被-refcell-包裹的结构体)

既然了解了结构体的借用规则和`RefCell`, 我们来看一段结合了两者的代码：

```rust
use std::cell::RefCell;
use std::io::Write;

struct Data {
    string: String,
}

struct S {
    data: Data,
    writer: Vec<u8>,
}

fn write(s: RefCell<S>) {
    let mut mut_s = s.borrow_mut();
    let str = &mut_s.data.string;
    mut_s.writer.write(str.as_bytes());
}
```

以上代码从`s`中可变借用出结构体`S`，随后又对结构体中的两个字段进行了分别借用，按照之前的规则这段代码应该顺利通过编译：

```console
error[E0502]: cannot borrow `mut_s` as mutable because it is also borrowed as immutable
  --> src/main.rs:16:5
   |
15 |     let str = &mut_s.data.string;
   |                ----- immutable borrow occurs here
16 |     mut_s.writer.write(str.as_bytes());
   |     ^^^^^              --- immutable borrow later used here
   |     |
   |     mutable borrow occurs here
```

只能说，还好它报错了，否则本篇文章已经可以结束。。。错误很简单，首先对结构体`S`的`data`字段进行了不可变借用，其次又对`writer`字段进行了可变借用，这个符合之前的规则：对结构体不同字段分开借用，为何报错了？

## [深入分析](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#深入分析)

第一感觉，问题是出在`borrow_mut`方法返回的类型上，先来看看:

```rust
pub fn borrow_mut(&self) -> RefMut<'_, T>
```

可以看出，该方法并没有直接返回我们的结构体，而是一个`RefMut`类型，而要使用该类型，需要经过编译器为我们做一次隐式的`Deref`转换，编译器展开后的代码大概如下:

```rust
use std::cell::RefMut;
use std::ops::{Deref, DerefMut};

fn write(s: RefCell<S>) {
    let mut mut_s: RefMut<S> = s.borrow_mut();
    let str = &Deref::deref(&mut_s).data.string;
    DerefMut::deref_mut(&mut mut_s).writer.write(str.as_bytes());
}
```

可以看出，对结构体字段的调用，实际上经过一层函数，一层函数！？我相信你应该想起了什么，是的，在[上一篇文章](https://course.rs/fight-with-compiler/borrowing/ref-exist-in-out-fn.html)中讲过类似的问题， 大意就是**编译器对于函数往往只会分析签名，并不关心内部到底如何使用结构体**。

而上面的`&Deref::deref(&mut_s)`和`DerefMut::deref_mut(&mut mut_s)`函数，签名全部使用的是结构体，并不是结构体中的某一个字段，因此对于编译器来说，该结构体明显是被重复借用了！

## [解决方法](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#解决方法)

因此要解决这个问题，我们得把之前的展开形式中的`Deref::deref`消除掉，这样没有了函数签名，编译器也将不再懒政。

既然两次`Deref::deref`调用都是对智能指针的自动`Deref`，那么可以提前手动的把它`Deref`了，只做一次！

```rust
fn write(s: RefCell<S>) {
    let mut mut_s = s.borrow_mut();
    let mut tmp = &mut *mut_s; // Here
    let str = &tmp.data.string;
    tmp.writer.write(str.as_bytes());
}
```

以上代码通过`*`对`mut_s`进行了解引用，获得结构体，然后又对结构体进行了可变借用`&mut`，最终赋予`tmp`变量，那么该变量就持有了我们的结构体的可变引用，而不再是持有一个智能指针。

此后对`tmp`的使用就回归到文章开头的那段代码：分别借用结构体的不同字段，成功通过编译！

#### [展开代码](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#展开代码)

我们再来模拟编译器对正确的代码进行一次展开:

```rust
use std::cell::RefMut;
use std::ops::DerefMut;

fn write(s: RefCell<S>) {
    let mut mut_s: RefMut<S> = s.borrow_mut();
    let tmp: &mut S = DerefMut::deref_mut(&mut mut_s);
    let str = &tmp.data.string;
    tmp.writer.write(str.as_bytes());
}
```

可以看出，此时对结构体的使用不再有`DerefMut::deref`的身影，我们成功消除了函数边界对编译器的影响！

## [不仅仅是 RefCell](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#不仅仅是-refcell)

事实上，除了 RefCell 外，还有不少会导致这种问题的智能指针，当然原理都是互通的，我们这里就不再进行一一深入讲解，只简单列举下：

- `Box`
- `MutexGuard`(来源于 Mutex)
- `PeekMut`(来源于 BinaryHeap)
- `RwLockWriteGuard`(来源于 RwLock)
- `String`
- `Vec`
- `Pin`

## [一个练习](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#一个练习)

下面再来一个练习巩固一下，强烈建议大家按照文章的思路进行分析和解决：

```rust
use std::rc::Rc;
use std::cell::RefCell;

pub struct Foo {
    pub foo1: Vec<bool>,
    pub foo2: Vec<i32>,
}
fn main() {
    let foo_cell = Rc::new(RefCell::new(Foo {
        foo1: vec![true, false],
        foo2: vec![1, 2]

    }));

    let borrow = foo_cell.borrow_mut();
    let foo1 = &borrow.foo1;
    // 下面代码会报错,因为`foo1`和`foo2`发生了重复借用
    borrow.foo2.iter_mut().enumerate().for_each(|(idx, foo2)| {
        if foo1[idx] {
            *foo2 *= -1;
        }
    });
}
```

## [总结](https://course.rs/compiler/fight-with-compiler/borrowing/borrow-distinct-fields-of-struct.html#总结)

当结构体的引用穿越函数边界时，我们要格外小心，因为编译器只会对函数签名进行检查，并不关心内部到底用了结构体的哪个字段，当签名都使用了结构体时，会立即报错。

而智能指针由于隐式解引用`Deref`的存在，导致了两次`Deref`时都让结构体穿越了函数边界`Deref::deref`，结果造成了重复借用的错误。

解决办法就是提前对智能指针进行手动解引用，然后对内部的值进行借用后，再行使用。



# [类型未限制](https://course.rs/compiler/fight-with-compiler/unconstrained.html#类型未限制)



# [幽灵数据](https://course.rs/compiler/fight-with-compiler/phantom-data.html#幽灵数据)



# [Rust 陷阱系列](https://course.rs/compiler/pitfalls/index.html#rust-陷阱系列)

本章收录一些 Rust 常见的陷阱，一不小心就会坑你的那种(当然，这不是 Rust 语言的问题，而是一些边边角角的知识点)。



# [for 循环中使用外部数组](https://course.rs/compiler/pitfalls/use-vec-in-for.html#for-循环中使用外部数组)

一般来说，`for`循环能做到的，`while`也可以，反之亦然，但是有一种情况，还真不行，先来看代码:

```rust
let mut v = vec![1,2,3];

for i in 0..v.len() {
    v.push(i);
    println!("{:?}",v);
}
```

我们的目的是创建一个无限增长的数组，往里面插入`0..`(看不懂该表达式的同学请查阅[流程控制](https://course.rs/basic/flow-control.html))的数值序列。

看起来上面代码可以完成，因为随着数组不停增长，`v.len()`也会不停变大，但是事实上真的如此吗？

```console
[1, 2, 3, 0]
[1, 2, 3, 0, 1]
[1, 2, 3, 0, 1, 2]
```

输出很清晰的表明，只新插入了三个元素：`0..=2`，刚好是`v`的初始长度。

这是因为：**在 for 循环中,`v.len`只会在循环伊始之时进行求值，之后就一直使用该值**。

行，问题算是清楚了，那该如何解决呢，我们可以使用`while`循环，该循环与`for`相反，每次都会重新求值：

```rust
let mut v = vec![1,2,3];

let mut i = 0;
while i < v.len() {
    v.push(i);
    i+=1;
    println!("{:?}",v);
}
```

友情提示，在你运行上述代码时，千万要及时停止，否则会`Boom` - 炸翻控制台。

# [线程类型导致的栈溢出](https://course.rs/compiler/pitfalls/stack-overflow.html#线程类型导致的栈溢出)

在 Rust 中，我们不太容易遇到栈溢出，因为默认栈还挺大的，而且大的数据往往存在堆上(动态增长)，但是一旦遇到该如何处理？先来看段代码：

```rust
#![feature(test)]
extern crate test;

#[cfg(test)]
mod tests {
    use test::Bencher;

    #[bench]
    fn it_works(b: &mut Bencher) {
        b.iter(|| { let stack = [[[0.0; 2]; 512]; 512]; });
    }
}
```

以上代码是一个测试模块，它在堆上生成了一个数组`stack`，初步看起来数组挺大的，先尝试运行下`cargo test`:

> 你很可能会遇到`#![feature(test)]`错误，因为该特性目前只存在`Rust Nightly`版本上，具体解决方法见[Rust 语言圣经](https://course.rs/appendix/rust-version.html#在指定目录使用rust-nightly)

```console
running 1 test

thread 'tests::it_works' has overflowed its stack
fatal runtime error: stack overflow
```

Bang，很不幸，遇到了百年一遇的栈溢出错误，再来试试`cargo bench`，竟然通过了测试，这是什么原因？为何`cargo test`和`cargo bench`拥有完全不同的行为？这就要从 Rust 的栈原理讲起。

首先看看`stack`数组，它的大小是`8 × 2 × 512 × 512 = 4 MiB`，嗯，很大，崩溃也正常(读者说，正常，只是作者你不太正常。。).

其次，`cargo test`和`cargo bench`，前者运行在一个新创建的线程上，而后者运行在**main 线程上**.

最后，`main`线程由于是老大，所以资源比较多，拥有令其它兄弟艳羡不已的`8MB`栈大小，而其它新线程只有区区`2MB`栈大小(取决于操作系统,`linux`是`2MB`,其它的可能更小)，再对比我们的`stack`大小，不崩溃就奇怪了。

因此，你现在明白，为何`cargo test`不能运行，而`cargo bench`却可以欢快运行。

如果实在想要增大栈的默认大小，以通过该测试，你可以这样运行:`RUST_MIN_STACK=8388608 cargo test`,结果如下：

```console
running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

Bingo, 成功了,最后再补充点测试的背景知识:

> `cargo test`为何使用新线程？因为它需要并行的运行测试用例，与之相反，`cargo bench`只需要顺序的执行，因此 main 线程足矣



# [算术溢出导致的 panic](https://course.rs/compiler/pitfalls/arithmetic-overflow.html#算术溢出导致的-panic)

在 Rust 中，溢出后的数值被截断是很正常的:

```rust
let x: u16 = 65535;
let v = x as u8;
println!("{}", v)
```

最终程序会输出`255`, 因此大家可能会下意识地就觉得算数操作在 Rust 中只会导致结果的不正确，并不会导致异常。但是实际上，如果是因为算术操作符导致的溢出，就会让整个程序 panic:

```rust
fn main() {
    let x: u8 = 10;

    let v = x + u8::MAX;
    println!("{}", v)
}
```

输出结果如下:

```console
thread 'main' panicked at 'attempt to add with overflow', src/main.rs:5:13
```

那么当我们确实有这种需求时，该如何做呢？可以使用 Rust 提供的`checked_xxx`系列方法：

```rust
fn main() {
    let x: u8 = 10;

    let v = x.checked_add(u8::MAX).unwrap_or(0);
    println!("{}", v)
}
```

也许你会觉得本章内容其实算不上什么陷阱，但是在实际项目快速迭代中，越是不起眼的地方越是容易出错：

```rust
fn main() {
    let v = production_rate_per_hour(5);
    println!("{}", v);
}

pub fn production_rate_per_hour(speed: u8) -> f64 {
    let cph: u8 = 221;
    match speed {
        1..=4 => (speed * cph) as f64,
        5..=8 => (speed * cph) as f64 * 0.9,
        9..=10 => (speed * cph) as f64 * 0.77,
        _ => 0 as f64,
    }
}

pub fn working_items_per_minute(speed: u8) -> u32 {
    (production_rate_per_hour(speed) / 60 as f64) as u32
}
```

上述代码中，`speed * cph`就会直接 panic:

```console
thread 'main' panicked at 'attempt to multiply with overflow', src/main.rs:10:18
```

是不是还藏的挺隐蔽的？因此大家在 Rust 中做数学运算时，要多留一个心眼，免得上了生产才发现问题所在。或者，你也可以做好单元测试:)



# [闭包上奇怪的生命周期](https://course.rs/compiler/pitfalls/closure-with-lifetime.html#闭包上奇怪的生命周期)

Rust 一道独特的靓丽风景就是生命周期，也是反复折磨新手的最大黑手，就连老手，可能一不注意就会遇到一些生命周期上的陷阱，例如闭包上使用引用。

## [一段简单的代码](https://course.rs/compiler/pitfalls/closure-with-lifetime.html#一段简单的代码)

先来看一段简单的代码:

```rust
fn fn_elision(x: &i32) -> &i32 { x }
let closure_slision = |x: &i32| -> &i32 { x };
```

乍一看，这段代码比古天乐还平平无奇，能有什么问题呢？来，走两圈试试：

```console
error: lifetime may not live long enough
  --> src/main.rs:39:39
   |
39 |     let closure = |x: &i32| -> &i32 { x }; // fails
   |                       -        -      ^ returning this value requires that `'1` must outlive `'2`
   |                       |        |
   |                       |        let's call the lifetime of this reference `'2`
   |                       let's call the lifetime of this reference `'1`
```

咦？竟然报错了，明明两个一模一样功能的函数，一个正常编译，一个却报错，错误原因是编译器无法推测返回的引用和传入的引用谁活得更久！

真的是非常奇怪的错误，学过[Rust 生命周期](https://course.rs/advance/lifetime/basic.html)的读者应该都记得这样一条生命周期消除规则: **如果函数参数中只有一个引用类型，那该引用的生命周期会被自动分配给所有的返回引用**。我们当前的情况完美符合，`fn_elision`函数的顺利编译通过，就充分说明了问题。

那为何闭包就出问题了？

## [一段复杂的代码](https://course.rs/compiler/pitfalls/closure-with-lifetime.html#一段复杂的代码)

为了验证闭包无法应用生命周期消除规则，再来看一个复杂一些的例子:

```rust
use std::marker::PhantomData;

trait Parser<'a>: Sized + Copy {
    fn parse(&self, tail: &'a str) -> &'a str {
        tail
    }
    fn wrap(self) -> Wrapper<'a, Self> {
        Wrapper {
            parser: self,
            marker: PhantomData,
        }
    }
}

#[derive(Copy, Clone)]
struct T<'x> {
    int: &'x i32,
}

impl<'a, 'x> Parser<'a> for T<'x> {}

struct Wrapper<'a, P>
where
    P: Parser<'a>,
{
    parser: P,
    marker: PhantomData<&'a ()>,
}

fn main() {
    // Error.
    let closure_wrap = |parser: T| parser.wrap();

    // No error.
    fn parser_wrap(parser: T<'_>) -> Wrapper<'_, T<'_>> {
        parser.wrap()
    }
}
```

该例子之所以这么复杂，纯粹是为了证明闭包上生命周期会失效，读者大大轻拍:) 编译后，不出所料的报错了：

```console
error: lifetime may not live long enough
  --> src/main.rs:32:36
   |
32 |     let closure_wrap = |parser: T| parser.wrap();
   |                         ------   - ^^^^^^^^^^^^^ returning this value requires that `'1` must outlive `'2`
   |                         |        |
   |                         |        return type of closure is Wrapper<'_, T<'2>>
   |                         has type `T<'1>`
```

## [深入调查](https://course.rs/compiler/pitfalls/closure-with-lifetime.html#深入调查)

一模一样的报错，说明在这种情况下，生命周期的消除规则也没有生效，看来事情确实不简单，我眉头一皱，决定深入调查，最后还真翻到了一些讨论，经过整理后，大概分享给大家。

首先给出一个结论：**这个问题，可能很难被解决，建议大家遇到后，还是老老实实用正常的函数，不要秀闭包了**。

对于函数的生命周期而言，它的消除规则之所以能生效是因为它的生命周期完全体现在签名的引用类型上，在函数体中无需任何体现:

```rust
fn fn_elision(x: &i32) -> &i32 {..}
```

因此编译器可以做各种编译优化，也很容易根据参数和返回值进行生命周期的分析，最终得出消除规则。

可是闭包，并没有函数那么简单，它的生命周期分散在参数和闭包函数体中(主要是它没有确切的返回值签名)：

```rust
let closure_slision = |x: &i32| -> &i32 { x };
```

编译器就必须深入到闭包函数体中，去分析和推测生命周期，复杂度因此极具提升：试想一下，编译器该如何从复杂的上下文中分析出参数引用的生命周期和闭包体中生命周期的关系？

由于上述原因(当然，实际情况复杂的多)， Rust 语言开发者其实目前是有意为之，针对函数和闭包实现了两种不同的生命周期消除规则。

## [总结](https://course.rs/compiler/pitfalls/closure-with-lifetime.html#总结)

虽然我言之凿凿，闭包的生命周期无法解决，但是未来谁又知道呢。最大的可能性就是之前开头那种简单的场景，可以被自动识别和消除。

总之，如果有这种需求，还是像古天乐一样做一个平平无奇的男人，老老实实使用函数吧。





# [失效的可变性](https://course.rs/compiler/pitfalls/the-disabled-mutability.html#失效的可变性)

众所周知 Rust 是一门安全性非常强的系统级语言，其中，显式的设置变量可变性，是安全性的重要组成部分。按理来说，变量可变不可变在设置时就已经决定了，但是你遇到过可变变量在某些情况失效，变成不可变吗？

先来看段正确的代码：

```rust
#[derive(Debug)]
struct A {
    f1: u32,
    f2: u32,
    f3: u32
}

#[derive(Debug)]
struct B<'a> {
    f1: u32,
    a: &'a mut A,
}

fn main() {
    let mut a: A = A{ f1: 0, f2: 1, f3: 2 };
    // b不可变
    let b: B = B{ f1: 3, a: &mut a };
    // 但是b中的字段a可以变
    b.a.f1 += 1;

    println!("b is {:?} ", &b);
}
```

在这里，虽然变量`b`被设置为不可变，但是`b`的其中一个字段`a`被设置为可变的结构体，因此我们可以通过`b.a.f1 += 1`来修改`a`的值。

也许有人还不知道这种部分可变性的存在，不过没关系，因为马上就不可变了：)

- 结构体可变时，里面的字段都是可变的，例如`&mut a`
- 结构体不可变时，里面的某个字段可以单独设置为可变，例如`b.a`

在理解了上面两条简单规则后，来看看下面这段代码:

```rust
#[derive(Debug)]
struct A {
    f1: u32,
    f2: u32,
    f3: u32
}

#[derive(Debug)]
struct B<'a> {
    f1: u32,
    a: &'a mut A,
}


impl B<'_> {
    // this will not work
    pub fn changeme(&self) {
        self.a.f1 += 1;
    }
}

fn main() {
    let mut a: A = A{ f1: 0, f2: 1, f3: 2 };
    // b is immutable
    let b: B = B{ f1: 3, a: &mut a };
    b.changeme();

    println!("b is {:?} ", &b);
}
```

这段代码，仅仅做了一个小改变，不再直接修改`b.a`，而是通过调用`b`上的方法去修改其中的`a`，按理说不会有任何区别。因此我预言：通过方法调用跟直接调用不应该有任何区别，运行验证下：

```console
error[E0594]: cannot assign to `self.a.f1`, which is behind a `&` reference
  --> src/main.rs:18:9
   |
17 |     pub fn changeme(&self) {
   |                     ----- help: consider changing this to be a mutable reference: `&mut self`
18 |         self.a.f1 += 1;
   |         ^^^^^^^^^^^^^^ `self` is a `&` reference, so the data it refers to cannot be written
```

啪，又被打脸了。我说我是大意了，没有闪，大家信不？反正马先生应该是信的:D

## [简单分析](https://course.rs/compiler/pitfalls/the-disabled-mutability.html#简单分析)

观察第一个例子，我们调用的`b.a`实际上是用`b`的值直接调用的，在这种情况下，由于所有权规则，编译器可以认定，只有一个可变引用指向了`a`，因此这种使用是非常安全的。

但是，在第二个例子中，`b`被藏在了`&`后面，根据所有权规则，同时可能存在多个`b`的借用，那么就意味着可能会存在多个可变引用指向`a`,因此编译器就拒绝了这段代码。

事实上如果你将第一段代码的调用改成:

```rust
let b: &B = &B{ f1: 3, a: &mut a };
b.a.f1 += 1;
```

一样会报错！

## [一个练习](https://course.rs/compiler/pitfalls/the-disabled-mutability.html#一个练习)

结束之前再来一个练习，稍微有点绕，大家品味品味：

```rust
#[derive(Debug)]
struct A {
    f1: u32,
    f2: u32,
    f3: u32
}

#[derive(Debug)]
struct B<'a> {
    f1: u32,
    a: &'a mut A,
}

fn main() {
    let mut a: A = A{ f1: 0, f2: 1, f3: 2 };
    let b: B = B{ f1: 3, a: &mut a };
    b.a.f1 += 1;
    a.f1 = 10;

    println!("b is {:?} ", &b);
}
```

小提示：这里`b.a.f1 += 1`和`a.f1 = 10`只能有一个存在，否则就会报错。

## [总结](https://course.rs/compiler/pitfalls/the-disabled-mutability.html#总结)

根据之前的观察和上面的小提示，可以得出一个结论：**可变性的真正含义是你对目标对象的独占修改权**。在实际项目中，偶尔会遇到比上述代码更复杂的可变性情况，记住这个结论，有助于我们拨云见日，直达本质。

学习，就是不断接近和认识事物本质的过程，对于 Rust 语言的学习亦是如此。





# [代码重构导致的可变借用错误](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#代码重构导致的可变借用错误)

相信大家都听说过**重构一时爽，一直重构一直爽**的说法，私以为这种说法是很有道理的，不然技术团队绩效从何而来？但是，在 Rust 中，重构可能就不是那么爽快的事了，不信？咱们来看看。

## [欣赏下报错](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#欣赏下报错)

很多时候，错误也是一种美，但是当这种错误每天都能见到时(呕):

```css
error[e0499]: cannot borrow ` * self` as mutable more than once at a time;
```

虽然这一类错误长得一样，但是我这里的错误可能并不是大家常遇到的那些妖艳错误，废话不多说，一起来看看。

## [重构前的正确代码](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#重构前的正确代码)

```rust
struct Test {
    a : u32,
    b : u32
}

impl Test {
    fn increase(&mut self) {
        let mut a = &mut self.a;
        let mut b = &mut self.b;
        *b += 1;
        *a += 1;
    }
}
```

这段代码是可以正常编译的，也许有读者会有疑问，`self`在这里被两个变量以可变的方式借用了，明明违反了 Rust 的所有权规则，为何它不会报错？

答案要从很久很久之前开始(啊哒~~~由于我太啰嗦，被正义群众来了一下，那咱现在开始长话短说，直接进入主题)。

#### [正确代码为何不报错？](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#正确代码为何不报错)

虽然从表面来看，`a`和`b`都可变引用了`self`，但是 Rust 的编译器在很多时候都足够聪明，它发现我们其实仅仅引用了同一个结构体中的不同字段，因此完全可以将其的借用权分离开来。

因此，虽然我们不能同时对整个结构体进行可变引用，但是我们可以分别对结构体中的不同字段进行可变引用，当然，一个字段至多也只能存在一个可变引用，这个最基本的所有权规则还是不能违反的。变量`a`引用结构体字段`a`，变量`b`引用结构体字段`b`，从底层来说，这种方式也不会造成两个可变引用指向了同一块内存。

至此，正确代码我们已经挖掘完毕，再来看看重构后的错误代码。

## [重构后的错误代码](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#重构后的错误代码)

由于领导说我们这个函数没办法复用，那就敷衍一下呗：

```rust
struct Test {
    a : u32,
    b : u32
}

impl Test {

    fn increase_a (&mut self) {
        self.a += 1;
    }

    fn increase(&mut self) {
        let b = &mut self.b;
        self.increase_a();
        *b += 1;
    }
}
```

既然领导说了，咱照做，反正他也没说怎么个复用法，咱就来个简单的，把`a`的递增部分复用下。

代码说实话。。。更丑了，但是更强了吗？

```console
error[E0499]: cannot borrow `*self` as mutable more than once at a time
  --> src/main.rs:14:9
   |
13 |         let b = &mut self.b;
   |                 ----------- first mutable borrow occurs here
14 |         self.increase_a();
   |         ^^^^ second mutable borrow occurs here
15 |         *b += 1;
   |         ------- first borrow later used here
```

嗯，最开始提到的错误，它终于出现了。

## [大聪明编译器](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#大聪明编译器)

为什么？明明之前还是正确的代码，就因为放入函数中就报错了？我们先从一个简单的理解谈起，当然这个理解也是浮于表面的，等会会深入分析真实的原因。

之前讲到 Rust 编译器挺聪明，可以识别到引用到不同的结构体字段，因此不会报错。但是现在这种情况下，编译器又不够聪明了，一旦放入函数中，编译器将无法理解我们对`self`的使用：它仅仅用到了一个字段，而不是整个结构体。

因此它会简单的认为，这个结构体作为一个整体被可变借用了，产生两个可变引用，一个引用整个结构体，一个引用了结构体字段`b`，这两个引用存在重叠的部分，最终导致编译错误。

## [被冤枉的编译器](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#被冤枉的编译器)

在工作生活中，我们无法理解甚至错误的理解一件事，有时是因为层次不够导致的。同样，对于本文来说，也是因为我们对编译器的所知不够，才冤枉了它，还给它起了一个屈辱的“大聪明”外号。

#### [深入分析](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#深入分析)

> 如果只改变相关函数的实现而不改变它的签名，那么不会影响编译的结果

何为相关函数？当函数`a`调用了函数`b`，那么`b`就是`a`的相关函数。

上面这句是一条非常重要的编译准则，意思是，对于编译器来说，只要函数签名没有变，那么任何函数实现的修改都不会影响已有的编译结果(前提是函数实现没有错误- , -)。

以前面的代码为例：

```rust
fn increase_a (&mut self) {
    self.a += 1;
}

fn increase(&mut self) {
    let b = &mut self.b;
    self.increase_a();
    *b += 1;
}
```

虽然`increase_a`在函数实现中没有访问`self.b`字段，但是它的签名允许它访问`b`，因此违背了借用规则。事实上，该函数有没有访问`b`不重要，**因为编译器在这里只关心签名，签名存在可能性，那么就立刻报出错误**。

为何会有这种编译器行为，主要有两个原因：

1. 一般来说，我们希望编译器有能力独立的编译每个函数，而无需深入到相关函数的内部实现，因为这样做会带来快得多的编译速度。
2. 如果没有这种保证，那么在实际项目开发中，我们会特别容易遇到各种错误。 假设我们要求编译器不仅仅关注相关函数的签名，还要深入其内部关注实现，那么由于 Rust 严苛的编译规则，当你修改了某个函数内部实现的代码后，可能会引起使用该函数的其它函数的各种错误！对于大型项目来说，这几乎是不可接受的！

然后，我们的借用类型这么简单，编译器有没有可能针对这种场景，在现有的借用规则之外增加特殊规则？答案是否定的，由于 Rust 语言的设计哲学：特殊规则的加入需要慎之又慎，而我们的这种情况其实还蛮好解决的，因此编译器不会为此新增规则。

## [解决办法](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#解决办法)

在深入分析中，我们提到一条重要的规则，要影响编译行为，就需要更改相关函数的签名，因此可以修改`increase_a`的签名:

```rust
fn increase_a (a :&mut u32) {
    *a += 1;
}

fn increase(&mut self) {
    let b = &mut self.b;
    Test::increase_a(&mut self.a);
    *b += 1;
}
```

此时，`increase_a`这个相关函数，不再使用`&mut self`作为签名，而是获取了结构体中的字段`a`，此时编译器又可以清晰的知道：函数`increase_a`和变量`b`分别引用了结构体中的不同字段，因此可以编译通过。

当然，除了修改相关函数的签名，你还可以修改调用者的实现：

```rust
fn increase(&mut self) {
    self.increase_a();
    self.b += 1;
}
```

在这里，我们不再单独声明变量`b`，而是直接调用`self.b+=1`进行递增，根据借用生命周期[NLL](https://course.rs/advance/lifetime/advance.html#nllnon-lexical-lifetime)的规则，第一个可变借用`self.increase_a()`的生命周期随着方法调用的结束而结束，那么就不会影响`self.b += 1`中的借用。

## [闭包中的例子](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#闭包中的例子)

再来看一个使用了闭包的例子:

```rust
use tokio::runtime::Runtime;

struct Server {
    number_of_connections : u64
}

impl Server {
    pub fn new() -> Self {
        Server { number_of_connections : 0}
    }

    pub fn increase_connections_count(&mut self) {
        self.number_of_connections += 1;
    }
}

struct ServerRuntime {
    runtime: Runtime,
    server: Server
}

impl ServerRuntime {
    pub fn new(runtime: Runtime, server: Server) -> Self {
        ServerRuntime { runtime, server }
    }

    pub fn increase_connections_count(&mut self) {
        self.runtime.block_on(async {
            self.server.increase_connections_count()
        })
    }
}
```

代码中使用了`tokio`，在`increase_connections_count`函数中启动了一个异步任务，并且等待它的完成。这个函数中分别引用了`self`中的不同字段:`runtime`和`server`，但是可能因为闭包的原因，编译器没有像本文最开始的例子中那样聪明，并不能识别这两个引用仅仅引用了同一个结构体的不同部分，因此报错了：

```console
error[E0501]: cannot borrow `self.runtime` as mutable because previous closure requires unique access
  --> the_little_things\src\main.rs:28:9
   |
28 |            self.runtime.block_on(async {
   |  __________^____________--------_______-
   | |          |            |
   | | _________|            first borrow later used by call
   | ||
29 | ||             self.server.increase_connections_count()
   | ||             ---- first borrow occurs due to use of `self` in generator
30 | ||         })
   | ||_________-^ second borrow occurs here
   | |__________|
   |            generator construction occurs here
```

#### [解决办法](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#解决办法-1)

解决办法很粗暴，既然编译器不能理解闭包中的引用是不同的，那么我们就主动告诉它:

```rust
pub fn increase_connections_count(&mut self) {
    let runtime = &mut self.runtime;
    let server = &mut self.server;
    runtime.block_on(async {
        server.increase_connections_count()
    })
}
```

上面通过变量声明的方式，在闭包外声明了两个变量分别引用结构体`self`的不同字段，这样一来，编译器就不会那么笨，编译顺利通过。

你也可以这么写：

```rust
pub fn increase_connections_count(&mut self) {
    let ServerRuntime { runtime, server } = self;
    runtime.block_on(async {
        server.increase_connections_count()
    })
}
```

当然，如果难以解决，还有一个笨办法，那就是将`server`和`runtime`分离开来，不要放在一个结构体中。

## [总结](https://course.rs/compiler/pitfalls/multiple-mutable-references.html#总结)

心中有剑，手中无剑，是武学至高境界。

本文列出的那条编译规则，在未来就将是大家心中的那把剑，当这些心剑招式足够多时，量变产生质变，终将天下无敌。



# [不太勤快的迭代器](https://course.rs/compiler/pitfalls/lazy-iterators.html#不太勤快的迭代器)

迭代器，在 Rust 中是一个非常耀眼的存在，它光鲜亮丽，它让 Rust 大道至简，它备受用户的喜爱。可是，它也是懒惰的，不信？一起来看看。

## [for 循环 vs 迭代器](https://course.rs/compiler/pitfalls/lazy-iterators.html#for-循环-vs-迭代器)

在迭代器学习中，我们提到过迭代器在功能上可以替代循环，性能上略微优于循环(避免边界检查),安全性上优于循环，因此在 Rust 中，迭代器往往都是更优的选择，前提是迭代器得发挥作用。

在下面代码中，分别是使用`for`循环和迭代器去生成一个`HashMap`。

使用循环:

```rust
use std::collections::HashMap;
#[derive(Debug)]
struct Account {
    id: u32,
}

fn main() {
    let accounts = [Account { id: 1 }, Account { id: 2 }, Account { id: 3 }];

    let mut resolvers = HashMap::new();
    for a in accounts {
        resolvers.entry(a.id).or_insert(Vec::new()).push(a);
    }

    println!("{:?}",resolvers);
}
```

使用迭代器:

```rust
let mut resolvers = HashMap::new();
accounts.into_iter().map(|a| {
    resolvers
        .entry(a.id)
        .or_insert(Vec::new())
        .push(a);
});
println!("{:?}",resolvers);
```

#### [预料之外的结果](https://course.rs/compiler/pitfalls/lazy-iterators.html#预料之外的结果)

两端代码乍一看(很多时候我们快速浏览代码的时候，不会去细看)都很正常, 运行下试试:

- `for`循环很正常，输出`{2: [Account { id: 2 }], 1: [Account { id: 1 }], 3: [Account { id: 3 }]}`
- 迭代器很。。。不正常，输出了一个`{}`, 黑人问号`? ?` **?**

在继续深挖之前，我们先来简单回顾下迭代器。

## [回顾下迭代器](https://course.rs/compiler/pitfalls/lazy-iterators.html#回顾下迭代器)

在迭代器章节中，我们曾经提到过，迭代器的[适配器](https://course.rs/advance/functional-programing/iterator.html#消费者与适配器)分为两种：消费者适配器和迭代器适配器，前者用来将一个迭代器变为指定的集合类型，往往通过`collect`实现；后者用于生成一个新的迭代器，例如上例中的`map`。

还提到过非常重要的一点: **迭代器适配器都是懒惰的，只有配合消费者适配器使用时，才会进行求值**.

## [懒惰是根因](https://course.rs/compiler/pitfalls/lazy-iterators.html#懒惰是根因)

在我们之前的迭代器示例中，只有一个迭代器适配器`map`:

```rust
accounts.into_iter().map(|a| {
    resolvers
        .entry(a.id)
        .or_insert(Vec::new())
        .push(a);
});
```

首先, `accounts`被拿走所有权后转换成一个迭代器，其次该迭代器通过`map`方法生成一个新的迭代器，最后，在此过程中没有以类如`collect`的消费者适配器收尾。

因此在上述过程中，`map`完全是懒惰的，它没有做任何事情，它在等一个消费者适配器告诉它：赶紧起床，任务可以开始了，它才会开始行动。

自然，我们的插值计划也失败了。

> 事实上，IDE 和编译器都会对这种代码给出警告：iterators are lazy and do nothing unless consumed

## [解决办法](https://course.rs/compiler/pitfalls/lazy-iterators.html#解决办法)

原因非常清晰，如果读者还有疑惑，建议深度了解下上面给出的迭代器链接，我们这里就不再赘述。

下面列出三种合理的解决办法：

1. 不再使用迭代器适配器`map`，改成`for_each`:

```rust
let mut resolvers = HashMap::new();
accounts.into_iter().for_each(|a| {
    resolvers
        .entry(a.id)
        .or_insert(Vec::new())
        .push(a);
});
```

但是，相关的文档也友善的提示了我们，除非作为链式调用的收尾，否则更建议使用`for`循环来处理这种情况。哎，忙忙碌碌，又回到了原点，不禁让人感叹：天道有轮回。

1. 使用消费者适配器`collect`来收尾，将`map`产生的迭代器收集成一个集合类型:

```rust
let resolvers: HashMap<_, _> = accounts
.into_iter()
.map(|a| (a.id, a))
.collect();
```

嗯，还挺简洁，挺`rusty`.

1. 使用`fold`，语义表达更强:

```rust
let resolvers = account.into_iter().fold(HashMap::new(), |mut resolvers, a|{
    resolvers.entry(a.id).or_insert(Vec::new).push(a);
    resolvers
});
```

## [总结](https://course.rs/compiler/pitfalls/lazy-iterators.html#总结)

在使用迭代器时，要清晰的认识到需要用到的方法是迭代型还是消费型适配器，如果一个调用链中没有以消费型适配器结尾，就需要打起精神了，也许，不远处就是一个陷阱在等你跳:)



# [无处不在的迭代器](https://course.rs/compiler/pitfalls/iterator-everywhere.html#无处不在的迭代器)

Rust 的迭代器无处不在，直至你在它上面栽了跟头，经过深入调查才发现：哦，原来是迭代器的锅。不信的话，看看这个报错你能想到是迭代器的问题吗: `borrow of moved value: words`.

## [报错的代码](https://course.rs/compiler/pitfalls/iterator-everywhere.html#报错的代码)

以下的代码非常简单，用来统计文本中字词的数量，并打印出来：

```rust
fn main() {
    let s = "hello world";
    let mut words = s.split(" ");
    let n = words.count();
    println!("{:?}",words);
}
```

四行代码，行云流水，一气呵成，且看成效：

```console
error[E0382]: borrow of moved value: `words`
   --> src/main.rs:5:21
    |
3   |     let mut words = s.split(" ");
    |         --------- move occurs because `words` has type `std::str::Split<'_, &str>`, which does not implement the `Copy` trait
4   |     let n = words.count();
    |                   ------- `words` moved due to this method call
5   |     println!("{:?}",words);
    |                     ^^^^^ value borrowed here after move
```

世事难料，我以为只有的生命周期、闭包才容易背叛革命，没想到一个你浓眉大眼的`count`方法也背叛革命。从报错来看，是因为`count`方法拿走了`words`的所有权，来看看签名：

```rust
fn count(self) -> usize
```

从签名来看，编译器的报错是正确的，但是为什么？为什么一个简单的标准库`count`方法就敢拿走所有权？

## [迭代器回顾](https://course.rs/compiler/pitfalls/iterator-everywhere.html#迭代器回顾)

在[迭代器](https://course.rs/advance/functional-programing/iterator.html#消费者与适配器)章节中，我们曾经学习过两个概念：迭代器适配器和消费者适配器，前者用于对迭代器中的元素进行操作，最终生成一个新的迭代器，例如`map`、`filter`等方法；而后者用于消费掉迭代器，最终产生一个结果，例如`collect`方法, 一个典型的示例如下：

```rust
let v1: Vec<i32> = vec![1, 2, 3];

let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();

assert_eq!(v2, vec![2, 3, 4]);
```

在其中，我们还提到一个细节，消费者适配器会拿走迭代器的所有权，那么这个是否与我们最开始碰到的问题有关系？

## [深入调查](https://course.rs/compiler/pitfalls/iterator-everywhere.html#深入调查)

要解释这个问题，必须要找到`words`是消费者适配器的证据，因此我们需要深入源码进行查看。

其实。。也不需要多深，只要进入`words`的源码，就能看出它属于`Iterator`特征，那说明`split`方法产生了一个迭代器？再来看看：

```rust
pub fn split<'a, P>(&'a self, pat: P) -> Split<'a, P>
where
    P: Pattern<'a>,
//An iterator over substrings of this string slice, separated by characters matched by a pattern.
```

还真是，从代码注释来看，`Split`就是一个迭代器类型，用来迭代被分隔符隔开的子字符串集合。

真相大白了，`split`产生一个迭代器，而`count`方法是一个消费者适配器，用于消耗掉前者产生的迭代器，最终生成字词统计的结果。

本身问题不复杂，但是在**解决方法上，可能还有点在各位客官的意料之外**，且看下文。

## [最 rusty 的解决方法](https://course.rs/compiler/pitfalls/iterator-everywhere.html#最-rusty-的解决方法)

你可能会想用`collect`来解决这个问题，先收集成一个集合，然后进行统计。当然此方法完全可行，但是很不`rusty`(很符合 rust 规范、潮流的意思)，以下给出最`rusty`的解决方案：

```rust
let words = s.split(",");
let n = words.clone().count();
```

在继续之前，我得先找一个地方藏好，因为俺有一个感觉，烂西红柿正在铺天盖地的呼啸而来，伴随而来的是读者的正义呵斥： **你管`clone`叫最好、最`rusty`的解决方法？？**

大家且听我慢慢道来，事实上，在 Rust 中`clone`不总是性能低下的代名词，因为`clone`的行为完全取决于它的具体实现。

#### [迭代器的`clone`代价](https://course.rs/compiler/pitfalls/iterator-everywhere.html#迭代器的clone代价)

对于迭代器而言，它其实并不需要持有数据才能进行迭代，事实上它包含一个引用，该引用指向了保存在堆上的数据，而迭代器自身的结构是保存在栈上。

因此对迭代器的`clone`仅仅是复制了一份栈上的简单结构，性能非常高效，例如:

```rust
pub struct Split<'a, T: 'a, P>
where
    P: FnMut(&T) -> bool,
{
    // Used for `SplitWhitespace` and `SplitAsciiWhitespace` `as_str` methods
    pub(crate) v: &'a [T],
    pred: P,
    // Used for `SplitAsciiWhitespace` `as_str` method
    pub(crate) finished: bool,
}

impl<T, P> Clone for Split<'_, T, P>
where
    P: Clone + FnMut(&T) -> bool,
{
    fn clone(&self) -> Self {
        Split { v: self.v, pred: self.pred.clone(), finished: self.finished }
    }
}
```

以上代码实现了对`Split`迭代器的克隆，可以看出，底层的的数组`self.v`并没有被克隆而是简单的复制了一个引用，依然指向了底层的数组`&[T]`，因此这个克隆非常高效。

## [总结](https://course.rs/compiler/pitfalls/iterator-everywhere.html#总结)

看起来是无效借用导致的错误，实际上是迭代器被消费了导致的问题，这说明 Rust 编译器虽然会告诉你错误原因，但是这个原因不总是根本原因。我们需要一双慧眼和勤劳的手，来挖掘出这个宝藏，最后为己所用。

同时，克隆在 Rust 中也并不总是**bad guy**的代名词，有的时候我们可以大胆去使用，当然前提是了解你的代码场景和具体的`clone`实现，这样你也能像文中那样作出非常`rusty`的选择。



# [线程间传递消息导致主线程无法结束](https://course.rs/compiler/pitfalls/main-with-channel-blocked.html#线程间传递消息导致主线程无法结束)

本篇陷阱较短，主要解决新手在多线程间传递消息时可能会遇到的一个问题：主线程会一直阻塞，无法结束。

Rust 标准库中提供了一个消息通道，非常好用，也相当简单明了，但是但是在使用起来还是可能存在坑：

```rust
use std::sync::mpsc;
fn main() {

    use std::thread;

    let (send, recv) = mpsc::channel();
    let num_threads = 3;
    for i in 0..num_threads {
        let thread_send = send.clone();
        thread::spawn(move || {
            thread_send.send(i).unwrap();
            println!("thread {:?} finished", i);
        });
    }

    for x in recv {
        println!("Got: {}", x);
    }
    println!("finished iterating");
}
```

以上代码看起来非常正常，运行下试试:

```console
thread 0 finished
thread 1 finished
Got: 0
Got: 1
thread 2 finished
Got: 2
```

奇怪，主线程竟然卡死了，最后一行` println!("finished iterating");`一直没有被输出。

其实，上面的描述有问题，主线程并不是卡死，而是`for`循环并没有结束，至于`for`循环不结束的原因是消息通道没有被关闭。

回忆一下 Rust 消息通道关闭的两个条件：所有发送者全部被`drop`或接收者被`drop`，由于`for`循环还在使用接收者，因为后者条件无法被满足，那么只能发送者全部被`drop`，才能让例子中的消息通道关闭。

来分析下代码，每一个子线程都从`send`获取了一个拷贝，然后该拷贝在子线程结束时自动被`drop`，看上去没问题啊。等等，好像`send`本身并没有被`drop`，因为`send`要等到`main`函数结束才会被`drop`，那么代码就陷入了一个尴尬的境地：`main`函数要结束需要`for`循环结束，`for`循环结束需要`send`被`drop`，而`send`要被`drop`需要`main`函数结束。。。

破局点只有一个，那就是主动`drop`掉`send`，这个简单，使用`std::mem::drop`函数即可，得益于`prelude`，我们只需要使用`drop`:

```rust
use std::sync::mpsc;
fn main() {

    use std::thread;

    let (send, recv) = mpsc::channel();
    let num_threads = 3;
    for i in 0..num_threads {
        let thread_send = send.clone();
        thread::spawn(move || {

            thread_send.send(i).unwrap();
            println!("thread {:?} finished", i);
        });
    }

    drop(send);
    for x in recv {
        println!("Got: {}", x);
    }
    println!("finished iterating");
}
```

此时再运行，主线程将顺利结束。

## [总结](https://course.rs/compiler/pitfalls/main-with-channel-blocked.html#总结)

本文总结了一个新手在使用消息通道时常见的错误，那就是忘记处理创建通道时得到的发送者，最后由于该发送者的存活导致通道无法被关闭，最终主线程阻塞，造成程序错误。



# [警惕 UTF-8 引发的性能隐患](https://course.rs/compiler/pitfalls/utf8-performance.html#警惕-utf-8-引发的性能隐患)

大家应该都知道, 虽然 Rust 的字符串 `&str`、`String` 在底层是通过 `Vec<u8>` 实现的：字符串数据以字节数组的形式存在堆上，但在使用时，它们都是 UTF-8 编码的，例如:

```rust
fn main() {
    let s: &str = "中国人";
    for c in s.chars() {
        println!("{}", c) // 依次输出：中 、 国 、 人
    }

    let c = &s[0..3]; // 1. "中" 在 UTF-8 中占用 3 个字节 2. Rust 不支持字符串索引，因此只能通过切片的方式获取 "中"
    assert_eq!(c, "中");
}
```

从上述代码，可以很清晰看出，Rust 的字符串确实是 UTF-8 编码的，这就带来一个隐患：可能在某个转角，你就会遇到来自糟糕性能的示爱。

## [问题描述 & 解决](https://course.rs/compiler/pitfalls/utf8-performance.html#问题描述--解决)

例如我们尝试写一个词法解析器，里面用到了以下代码 `self.source.chars().nth(self.index).unwrap();` 去获取下一个需要处理的字符，大家可能会以为 `.nth` 的访问应该非常快吧？事实上它确实很快，但是并不妨碍这段代码在循环处理 70000 长度的字符串时，需要消耗 5s 才能完成！

这么看来，唯一的问题就在于 `.chars()` 上了。

其实原因很简单，简单到我们不需要用代码来说明，只需要文字描述即可传达足够的力量：每一次循环时，`.chars().nth(index)` 都需要对字符串进行一次 UTF-8 解析，这个解析实际上是相当昂贵的，特别是当配合循环时，算法的复杂度就是平方级的。

既然找到原因，那解决方法也很简单：只要将 `self.source.chars()` 的迭代器存储起来就行，这样每次 `.nth` 调用都会复用已经解析好的迭代器，而不是重新去解析一次 UTF-8 字符串。

当然，我们还可以使用三方库来解决这个问题，例如 [str_indices](https://crates.io/crates/str_indices)。

## [总结](https://course.rs/compiler/pitfalls/utf8-performance.html#总结)

最终的优化结果如下：

- 保存迭代器后: 耗时 `5s` -> `4ms`
- 进一步使用 `u8` 字节数组来替换 `char`，最后使用 `String::from_utf8` 来构建 UTF-8 字符串: 耗时 `4ms` -> `400us`

**肉眼可见的巨大提升，12500 倍！**

总之，我们在热点路径中使用字符串做 UTF-8 的相关操作时，就算不提前优化，也要做到心里有数，这样才能在问题发生时，进退自如。