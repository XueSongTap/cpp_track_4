CREATE DATABASE IF NOT EXISTS `actix_user_crud`;
USE `actix_user_crud`;

DROP TABLE IF EXISTS `users_to_groups`;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `user_info`;

CREATE TABLE IF NOT EXISTS users 
(
	id VARCHAR(48) NOT NULL UNIQUE,
	name VARCHAR(64) NOT NULL UNIQUE,
	email VARCHAR(256) NOT NULL UNIQUE,
	PRIMARY KEY (id)
);
            
CREATE TABLE IF NOT EXISTS `groups`
(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL UNIQUE,
    PRIMARY KEY(id)
);
            
CREATE TABLE IF NOT EXISTS `users_to_groups`
(
    `user_id` VARCHAR(48) NOT NULL,
    `group_id` BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`)
);


CREATE TABLE IF NOT EXISTS `user_info`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户序号，自动递增，主键',
  `user_name` varchar(32) NOT NULL DEFAULT '' COMMENT '用户名称',
  `nick_name` varchar(32) CHARACTER SET utf8mb4 NOT NULL DEFAULT '' COMMENT '用户昵称',
  `password` varchar(32) NOT NULL DEFAULT '' COMMENT '密码',
  `phone` varchar(16) NOT NULL DEFAULT '' COMMENT '手机号码',
  `email` varchar(64) DEFAULT '' COMMENT '邮箱',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nick_name` (`nick_name`),
  UNIQUE KEY `uq_user_name` (`user_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8 COMMENT='用户信息表';

CREATE USER IF NOT EXISTS 'sqlx_user_crud'@'localhost' IDENTIFIED BY 'rust_is_the_future';
GRANT SELECT, INSERT, UPDATE, DELETE ON `actix_user_crud`.* TO 'sqlx_user_crud'@'localhost';