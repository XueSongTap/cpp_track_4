/* 引入头文件及全局变量 */
#include <linux/vmalloc.h>
#include <linux/init.h>
#include <linux/module.h>

#define MEMVMALLOC_SIZE 10240
char *vpm=NULL;
static int __init VmallocFunc_Init(void);
static void __exit VmallocFunc_Exit(void);

/* 内核模块初始化函数设计 */
static int __init VmallocFunc_Init(void)
{
    vpm=(char*)vmalloc(MEMVMALLOC_SIZE);
    if(NULL==vpm)
    {
        printk("vmalloc(...) Failed.\n");        
    }
    else
    {
        printk("vmalloc(...) successfully. address = 0x%lx\n",(unsigned long)vpm);
    }

    return 0;
}

/* 内核模块退出函数设计 */
static void __exit VmallocFunc_Exit(void)
{
    if(NULL!=vpm)
    {
        vfree(vpm);
        printk("vfree(...) successfully.\n");
    }
    printk("EXIT Kernel Module.\n");
}

/* 模块初始化函数和模块退出函数调用 */
module_init(VmallocFunc_Init);
module_exit(VmallocFunc_Exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("LingShengEDU.");
MODULE_DESCRIPTION("Kernel module : vmalloc()/vfee()");




