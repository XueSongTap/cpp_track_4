#include <linux/module.h>
#include <linux/init.h>
#include <linux/fs.h>
#include <asm/uaccess.h>
#include <linux/wait.h>
#include <linux/semaphore.h>
#include <linux/sched.h>
#include <linux/cdev.h>
#include <linux/types.h>
#include <linux/kdev_t.h>
#include <linux/device.h>
#include <linux/uaccess.h>

#define MAXNUM 1000
#define MAJOR_NUM 466 

struct dev{
    struct cdev devm; 
    struct semaphore sem;
    wait_queue_head_t outq;
    int flag; 
    char buffer[MAXNUM+1]; 
    char *rd,*wr,*end; 
}globalvar;
static struct class *my_class;
int major=MAJOR_NUM;

static ssize_t Globalvar_ReadFunc(struct file *,char *,size_t ,loff_t *);
static ssize_t Globalvar_WriteFunc(struct file *,const char *,size_t ,loff_t *);
static int Globalvar_OpenFunc(struct inode *inode,struct file *filp);
static int Globalvar_ReleaseFunc(struct inode *inode,struct file *filp);

struct file_operations globalvar_fops =
{
    .read=Globalvar_ReadFunc,
    .write=Globalvar_WriteFunc,
    .open=Globalvar_OpenFunc,
    .release=Globalvar_ReleaseFunc,
};

static ssize_t Globalvar_ReadFunc(struct file *filp,char *buf,size_t len,loff_t *off)
{
    if(wait_event_interruptible(globalvar.outq,globalvar.flag!=0))  //不可读时 阻塞读进程
    {
        return -ERESTARTSYS;
    }

    if(down_interruptible(&globalvar.sem)) //P 操作
    {
        return -ERESTARTSYS;
    }
    globalvar.flag = 0;
    printk("Into the read function\n");
    printk("The rd is %c\n",*globalvar.rd); //读指针
    if(globalvar.rd < globalvar.wr)
        len = min(len,(size_t)(globalvar.wr - globalvar.rd)); //更新读写长度
    else
        len = min(len,(size_t)(globalvar.end - globalvar.rd));
    printk("The len is %ld\n",len);
   
    if(copy_to_user(buf,globalvar.rd,len))
    {
        printk(KERN_ALERT"Copy failed.\n\n");

        up(&globalvar.sem);
        return -EFAULT;
    }
    printk("The read buffer is %s\n",globalvar.buffer);
    globalvar.rd = globalvar.rd + len;
    if(globalvar.rd == globalvar.end)
        globalvar.rd = globalvar.buffer; //字符缓冲区循环
    up(&globalvar.sem); //V 操作
    return len;
}

static ssize_t Globalvar_WriteFunc(struct file *filp,const char *buf,size_t len,loff_t *off)
{
    if(down_interruptible(&globalvar.sem)) //P 操作
    {
        return -ERESTARTSYS;
    }
    if(globalvar.rd <= globalvar.wr)
        len = min(len,(size_t)(globalvar.end - globalvar.wr));
    else
        len = min(len,(size_t)(globalvar.rd-globalvar.wr-1));
    printk("the write len is %ld\n",len);
    if(copy_from_user(globalvar.wr,buf,len))
    {
        up(&globalvar.sem); //V 操作
        return -EFAULT;
    }
    printk("the write buffer is %s\n",globalvar.buffer);
    printk("the len of buffer is %ld\n",strlen(globalvar.buffer));
    globalvar.wr = globalvar.wr + len;
    if(globalvar.wr == globalvar.end)
    globalvar.wr = globalvar.buffer; //循环
    up(&globalvar.sem);
    
    //V 操作
    globalvar.flag=1; //条件成立,可以唤醒读进程
    wake_up_interruptible(&globalvar.outq); //唤醒读进程
    return len;
}

static int Globalvar_OpenFunc(struct inode *inode,struct file *filp)
{
    try_module_get(THIS_MODULE);            //模块计数加1
    printk("This chrdev is in open.\n");

    return(0);
}

static int Globalvar_ReleaseFunc(struct inode *inode,struct file *filp)
{
    module_put(THIS_MODULE);                //模块计数减1
    printk("This chrdev is in release.\n");
    return(0);
}

//内核模块的初始化
static int Globalvar_initFunc(void)
{
    int result = 0;
    int err = 0;

    dev_t dev = MKDEV(major, 0);
    if(major)
    {       
        result = register_chrdev_region(dev, 1, "charmem"); //静态申请设备编号
    }
    else
    {        
        result = alloc_chrdev_region(&dev, 0, 1, "charmem"); //动态分配设备号
        major = MAJOR(dev);
    }
    if(result < 0)
        return result;

    cdev_init(&globalvar.devm, &globalvar_fops);
  
    globalvar.devm.owner = THIS_MODULE;
    err = cdev_add(&globalvar.devm, dev, 1);
    if(err)
        printk(KERN_INFO "Error %d Adding char_mem Device", err);
    else
    {
        printk("Globalvar register success.\n");
        sema_init(&globalvar.sem,1);                //初始化信号量
        init_waitqueue_head(&globalvar.outq);       //初始化等待队列
        globalvar.rd = globalvar.buffer;            //读指针
        globalvar.wr = globalvar.buffer;            //写指针
        globalvar.end = globalvar.buffer + MAXNUM;  //缓冲区尾指针
        globalvar.flag = 0;                         // 阻塞唤醒标志置 0
    }

    my_class = class_create(THIS_MODULE, "chardev0");
    device_create(my_class, NULL, dev, NULL, "chardev0");

    return 0;
}

static void Globalvar_exitFunc(void)
{
    device_destroy(my_class, MKDEV(major, 0));
    class_destroy(my_class);
    cdev_del(&globalvar.devm);
    unregister_chrdev_region(MKDEV(major, 0), 1);   //注销设备
}
module_init(Globalvar_initFunc);
module_exit(Globalvar_exitFunc);
MODULE_LICENSE("GPL");
