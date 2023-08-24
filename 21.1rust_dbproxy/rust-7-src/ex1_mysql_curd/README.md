步骤：
1. 通过导入schema.sql创建数据库
sudo mysql -u root -p < schema.sql
2. 运行
cargo run


数据设计

数据库中有3个表：（1）用户（2）组（3）用户组。

show databases;
use actix_user_crud;

 show tables;