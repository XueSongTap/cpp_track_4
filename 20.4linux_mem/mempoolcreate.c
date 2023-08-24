/* 引入头文件及全局变量 */
#include <linux/vmalloc.h>
#include <linux/init.h>
#include <linux/module.h>

static struct kmem_cache *kmemp=NULL;
static mempool_t *pools=NULl;

static int __init MempoolCreate_Init(void);
static void __exit MempoolCreate_Exit(void);

/* 内核模块初始化函数设计 */
static int __init MempoolCreate_Init(void)
{
    // 使用kmem_cache_create(...)/mempool_create(...)
  

    return 0;
}

/* 内核模块退出函数设计 */
static void __exit MempoolCreate_Exit(void)
{
    if(NULL!=pools)
    {
        mempool_destroy(pools); // 删除创建内存池
        printk("mempool_destroy(...) successfully.\n");
    }
    printk("EXIT Kernel Module.\n");
}

/* 模块初始化函数和模块退出函数调用 */
module_init(MempoolCreate_Init);
module_exit(MempoolCreate_Exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("LingShengEDU.");
MODULE_DESCRIPTION("Kernel module : vmalloc()/vfee()");

/*
内存池创建的时候需要有内存分配和释放，当内存元素是slab对象时:
mempool_alloc_slab(...)/mempool_free_slab(...)
有时间的话，大家可以动手写一写，然后我们在应用程序直接引用。
*/


