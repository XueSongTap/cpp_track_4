#include <stdio.h>

void func_d() // 5
{
    for (int i = 5 * 10000; i--;); //5
}
void func_a()  // 10+5= 15
{
    for (int i = 10 * 10000; i--;); //10 
    func_d();   //5 
}
void func_b()
{
    for (int i = 20 * 10000; i--;);  // 20
}
void func_c()
{
    for (int i = 35 * 10000; i--;); // 35
}
int main(void)
{
    printf("main into\n");
    while (1)  // 100
    {
        for (int i = 30 * 10000; i--;); // 30 
        func_a(); //10+5 =15
        func_b(); // 20
        func_c(); // 35
    }
    printf("main end\n");
    return 0;
}
