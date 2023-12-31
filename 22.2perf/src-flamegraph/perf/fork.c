#include <stdio.h>
#include <sys/types.h>
#include <unistd.h> 
#include <wait.h>
void test_little(void)
{
    int i, j;

    for (i = 0; i < 30000000; i++)
        j = i;
}

void test_mdedium(void)
{
    int i, j;

    for (i = 0; i < 60000000; i++)
        j = i;
}

void test_high(void)
{
    int i, j;

    for (i = 0; i < 90000000; i++)
        j = i;
}

void test_hi(void)
{
    int i, j;

    for (i = 0; i < 120000000; i++)
        j = i;
}

int main(void)
{
    int i, pid, result;

    for (i = 0; i < 2; i++)
    {
        result = fork();
        if (result > 0)
            printf("i=%d parent parent=%d current=%d child=%d\n", i, getppid(), getpid(), result);
        else
            printf("i=%d child parent=%d current=%d\n", i, getppid(), getpid());

        if (i == 0)
        {
            test_little();
            // sleep(1);
        }
        else
        {
            test_mdedium();
            // sleep(1);
        }
    }

    pid = wait(NULL);
    test_high();
    printf("pid=%d wait=%d\n", getpid(), pid);
    // sleep(1);
    /*
    父进程一旦调用了wait就立即阻塞自己，由wait自动分析是否当前进程的某个子进程已经退出，如果让它找到了这样一个已经变成僵尸的子进程，
    wait就会收集这个子进程的信息，并把它彻底销毁后返回；如果没有找到这样一个子进程，wait就会一直阻塞在这里，直到有一个出现为止。
    */
    pid = wait(NULL); 
    test_hi();
    printf("pid=%d wait=%d\n", getpid(), pid);
    return 0;
}