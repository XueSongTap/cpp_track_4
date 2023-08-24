#include<sys/types.h>
#include<unistd.h>
#include<sys/stat.h>
#include<stdio.h>
#include<fcntl.h>
#include<string.h>

int main(int argc,char* argv[])
{
    int iFd;
    char SendMsg[200];
    iFd= open("/dev/chardev0",O_RDWR,S_IRUSR|S_IWUSR);
    if(-1!=iFd)
    {
        while(1)
        {
            printf("Please enter the transmission message:");
            scanf("%s",SendMsg);
            write(iFd,SendMsg,strlen(SendMsg));
            if(strcmp(SendMsg,"quit")==0 || strcmp(SendMsg,"QUIT")==0 || strcmp(SendMsg,"EXIT")==0 || strcmp(SendMsg,"exit")==0) 
            {
                close(iFd);
                break;
            }
        }
    }
    else
    {
        printf("Device open failure, Pease recheck.\n\n");
    }

    return 0;
}

