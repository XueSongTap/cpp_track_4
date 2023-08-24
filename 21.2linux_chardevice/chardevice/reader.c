#include<sys/types.h>
#include<unistd.h>
#include<sys/stat.h>
#include<stdio.h>
#include<fcntl.h>
#include<string.h>

int main(int argc,char* argv[])
{
    int iFd=0,i=0;
    char ReceieMsg[200];
    iFd= open("/dev/chardev0",O_RDWR,S_IRUSR|S_IWUSR);
    if(-1!=iFd)
    {
        while(1)
        {
            for(i=0;i<200;i++)
                ReceieMsg[i]='\0';
            read(iFd,ReceieMsg,199);
            printf("Read data information：%s\n",ReceieMsg);
            if(strcmp(ReceieMsg,"quit")==0 || strcmp(ReceieMsg,"QUIT")==0 || strcmp(ReceieMsg,"EXIT")==0 || strcmp(ReceieMsg,"exit")==0)
            {
                close(iFd);
                break;
            }
        }
    }
    else
    {
        printf("Device open failure Sign:[%d]\n\n",iFd);
    }

    return 0;
}

