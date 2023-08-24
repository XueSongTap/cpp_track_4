/* 引入头文件及全局变量 */
#include <linux/vmalloc.h>
#include <linux/init.h>
#include <linux/module.h>
#include <linux/slab.h>


char *vpm=NULL;
struct kmem_cache *mycachep=NULL;

static int __init kmemcache_Init(void);
static void __exit kmemcache_Exit(void);

/* 内核模块初始化函数设计 */
static int __init kmemcache_Init(void)
{
    mycachep=kmem_cache_create("my_cache",32,0,SLAB_HWCACHE_ALIGN,NULL);
    if(NULL==mycachep)
    {
        printk("kmem_cache_create(...) Failed.\n");
    }
    else
    {
        printk("Cache size is : %d \n",kmem_cache_size(mycachep));
    } 

    return 0;
}

/* 内核模块退出函数设计 */
static void __exit kmemcache_Exit(void)
{
    if(NULL!=mycachep)
    {
        kmem_cache_destroy(mycachep);
        printk("kmem_cache_destroy(...) successfully.\n");
    }
    printk("EXIT Kernel Module.\n");
}

/* 模块初始化函数和模块退出函数调用 */
module_init(kmemcache_Init);
module_exit(kmemcache_Exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("LingShengEDU.");
MODULE_DESCRIPTION("Kernel module : vmalloc()/vfee()");




