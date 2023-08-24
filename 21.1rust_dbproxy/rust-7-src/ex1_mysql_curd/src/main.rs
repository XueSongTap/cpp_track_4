use sqlx::{FromRow};
use sqlx::mysql::MySqlPool;
use sqlx::Executor;
use sqlx::mysql::MySqlRow;
use sqlx::{Row};
use std::sync::Arc;
use std::error::Error;
use sqlx::mysql::MySqlPoolOptions;
use std::time::{Duration, Instant};
/* sqlx::FromRow 这个 macro 会自动将 database 的记录映射成 rust 的 struct，
也就是说，数据库表中的列会映射成 struct 中的 field，而 Serialize 这个 macro 则提供序列化的功能。
*/
#[derive(sqlx::FromRow)]
# [derive (Debug)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
}

 
// https://docs.rs/sqlx/latest/sqlx/mysql/index.html
#[tokio::main]
async fn main()  -> Result<(), sqlx::Error>  {
    println!("Hello, world!");

    let db_url = "mysql://root:123456@127.0.0.1/actix_user_crud";
    // let db_pool    = MySqlPool::connect("mysql://root:123456@127.0.0.1/actix_user_crud").await?;
    // let db_pool    = MySqlPool::connect(db_url).await?;
    // let db_pool = MySqlPool::connect(&db_url).await.unwrap();

    let db_pool = MySqlPoolOptions::new()
     .connect_timeout(Duration::from_secs(10))
     .min_connections(50)
     .max_connections(100)
     .idle_timeout(Duration::from_secs(600))
     .connect(db_url)
     .await.unwrap();


    println!("db_pool is : {:?}", db_pool);

    let mut user = User{id: String::from("123"), 
            name: String::from("darren"), 
            email: String::from("123@qq.com")};
    // 删除
    sqlx::query(
        r#"
        DELETE FROM users
        WHERE `id` = ?
        "#,
    )
    .bind(&user.id)
    .execute(&db_pool)
    .await.unwrap();

    // 增加
    sqlx::query(
        r#"
        INSERT INTO users (`id`, `name`, `email`)
        VALUES(?, ?, ?)"#,
    )
    .bind(&user.id)
    .bind(&user.name)
    .bind(&user.email)
    .execute(&db_pool)
    .await.unwrap();

    // 查询
    let mut stream = sqlx::query_as::<_, User>(
           r#"
        SELECT `id`, `name`, `email`
        FROM `users`
        WHERE `id` = ?"#,
    )
    .bind(&user.id)
    .fetch_one(&db_pool).await?;

    println!("stream: {:?}", stream);
 
    user.name = String::from("Darren+Mark");    
    // 修改
    sqlx::query(
        r#"
        UPDATE users
        SET `name` = ?, `email` = ?
        WHERE `id` = ?
        "#,
    )
    .bind(&user.name)
    .bind(&user.email)
    .bind(&user.id)
    .execute(&db_pool)
    .await.unwrap();

    // 查

    Ok(())
}
