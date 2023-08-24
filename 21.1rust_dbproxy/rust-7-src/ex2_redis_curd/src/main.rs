extern crate redis;
use crate::redis::Commands;
use crate::redis::ConnectionLike;
use redis::Connection;
use std::collections::HashSet;

fn main() {
    let mut con = connection_redis().ok().unwrap();
    // 测试是否成功连接Reids
    let is_open = con.is_open();
    println!("is_open: {}", is_open);
    println!();
    println!("******************************");
    println!();

    // 低级命令
    let is_ok = low_level_commands(&mut con).is_ok();
    println!("low_level_commands exec is_ok: {}", is_ok);
    println!();
    println!("******************************");
    println!();

    // 高级命令
    let is_ok = high_level_commands(&mut con).is_ok();
    println!("high_level_commands exec is_ok: {}", is_ok);
    println!();
    println!("******************************");
    println!();

    let is_ok = transaction(&mut con).is_ok();
    println!("transaction is_ok: {}", is_ok);
}

/**
 * 连接connection_redis
 */
fn connection_redis() -> redis::RedisResult<Connection> {
    // let client = redis::Client::open("redis://:redismima@47.94.192.17:6378/")?;
    let client = redis::Client::open("redis://127.0.0.1/")?;
    let con = client.get_connection()?;
    Ok(con)
}

/**
 * 低级命令
 */
fn low_level_commands(con: &mut redis::Connection) -> redis::RedisResult<()> {
    // 在Redis上新增一条key为my_key, value为42的数据
    let _: () = redis::cmd("SET").arg("my_key").arg(42).query(con)?;

    // 获取key为my_key的value
    let my_key: i32 = redis::cmd("GET").arg("my_key").query(con)?;
    println!("my_key: {}", my_key);

    // hash 结构操作
    let _: () = redis::cmd("HSET")
        .arg("books")
        .arg("java")
        .arg(1)
        .arg("python")
        .arg(2)
        .query(con)?;
    let java_value: i32 = redis::cmd("HGET").arg("books").arg("java").query(con)?;
    println!("java_value: {}", java_value);

    Ok(())
}

/**
 * 高级命令
 */
fn high_level_commands(con: &mut redis::Connection) -> redis::RedisResult<()> {
    // String 类型操作
    con.set("count", 42)?;
    let count: i32 = con.get("count")?;
    println!("count: {}", count);

    con.incr("count", 100)?;
    let incr_count: i32 = con.get("count")?;
    println!("incr_count: {}", incr_count);

    // hash 类型操作
    con.hset("student", "name", "张三")?;
    con.hset("student", "age", 20)?;
    let name: String = con.hget("student", "name")?;
    println!("name: {}", name);

    // list操作
    con.lpush("students", "张三")?;
    con.lpush("students", "李四")?;
    let len: i32 = con.llen("students")?;
    println!("students lengtth: {}", len);
    // zset操作
    con.zadd("scores", "张三", 60)?;
    con.zadd("scores", "李四", 80)?;
    // 找到score 在70 - 100 之间的name
    let names: HashSet<String> = con.zrangebyscore("scores", 70, 100)?;

    for name in names {
        println!("name: {}", name);
    }

    Ok(())
}

/**
 * 事务
 */
fn transaction(con: &mut redis::Connection) -> redis::RedisResult<()> {
    let key = "transaction_test_key";
    con.set(key, 1)?;
    let (new_val,): (isize,) = redis::transaction(con, &[key], |con, pipe| {
        let old_val: isize = con.get(key)?;
        println!("old_val is: {}", old_val);
        pipe.incr(key, 2)
            .ignore()
            .incr(key, 100)
            .ignore()
            .get(key)
            .query(con)
    })?;
    println!("new_val is: {}", new_val);

    Ok(())
}

