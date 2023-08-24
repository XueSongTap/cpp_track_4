//
//  Hello World 客户端
//  连接REQ套接字至 tcp://localhost:5555
//  发送Hello给服务端，并接收World
//
//  Hello World client
#include <zmq.h>
#include <string.h>
#include <stdio.h>
#include <sys/time.h>
#include <unistd.h>

static uint64_t get_tick_count()
{
    struct timeval tval;
    uint64_t ret_tick;
    
    gettimeofday(&tval, NULL);
    
    ret_tick = tval.tv_sec * 1000L + tval.tv_usec / 1000L;
    return ret_tick;
}


//编译：gcc -o hwclient hwclient.c -lzmq
int main (void)
{
    printf ("Connecting to hello world server...\n");
    void *context = zmq_ctx_new ();
    //  连接至服务端的套接字
    void *requester = zmq_socket (context, ZMQ_REQ);
    zmq_connect (requester, "tcp://localhost:5555");

    uint64_t request_number = 0;
    char buffer [128];
    int ret = 0;
    uint64_t start_time = get_tick_count();
    uint64_t end_time = get_tick_count();
    while (1)
    {
        request_number++;
        /* code */
        // printf ("正在发送1 Hello %d...\n", request_number);
        ret = zmq_send (requester, "Hello", 5, 0);
        if(ret < 0) 
        {
            printf("zmq_send failed\n");
        }
        ret = zmq_recv (requester, buffer, 6, 0); 
        if(ret < 0) 
        {
            printf("zmq_recv failed\n");
        } 
        // printf("zmq_recv:%s\n", buffer);
        if(request_number % 10000 == 0)  { // req -> rep
            end_time = get_tick_count();
            printf("req-rep need time:%lums, request_number:%lu, ops:%ld/s\n",  
                end_time - start_time, request_number, request_number*1000/(end_time - start_time));
        }
        // char *p = (char *)malloc(10);
        // free(p);
    }

    zmq_close (requester);
    zmq_ctx_destroy (context);
    return 0;
}
// //
// //  Hello World 客户端
// //  连接REQ套接字至 tcp://localhost:5555
// //  发送Hello给服务端，并接收World
// //
// //  Hello World client
// #include <zmq.h>
// #include <string.h>
// #include <stdio.h>
// #include <sys/time.h>
// #include <unistd.h>

// static uint64_t get_tick_count()
// {
//     struct timeval tval;
//     uint64_t ret_tick;
    
//     gettimeofday(&tval, NULL);
    
//     ret_tick = tval.tv_sec * 1000L + tval.tv_usec / 1000L;
//     return ret_tick;
// }


// //编译：gcc -o hwclient hwclient.c -lzmq
// int main (void)
// {
//     printf ("Connecting to hello world server...\n");
//     void *context = zmq_ctx_new ();
//     //  连接至服务端的套接字
//     void *requester = zmq_socket (context, ZMQ_REQ);
//     int send_timeout = 1000;        // 设置超时1000ms
//     int rc = zmq_setsockopt (requester, ZMQ_SNDTIMEO, &send_timeout, sizeof(send_timeout));
//     if(rc < 0)
//     {
//         printf("zmq_setsockopt send_timeout failed\n");
//         return -1;
//     }
//     int recv_timeout = 1000;        // 设置超时1000ms
//     rc = zmq_setsockopt (requester, ZMQ_RCVTIMEO, &recv_timeout, sizeof(recv_timeout));
//     if(rc < 0)
//     {
//         printf("zmq_setsockopt recv_timeout failed\n");
//         return -1;
//     }

//     int relaxed = 1;        // 设置超时1000ms
//     rc = zmq_setsockopt (requester, ZMQ_REQ_RELAXED, &relaxed, sizeof(relaxed));
//     if(rc < 0)
//     {
//         printf("zmq_setsockopt recv_timeout failed\n");
//         return -1;
//     }

    
//     zmq_connect (requester, "tcp://localhost:5555");

//     uint64_t request_number = 0;
//     char buffer [128];
//     int ret = 0;
//     uint64_t start_time = get_tick_count();
//     uint64_t end_time = get_tick_count();
//     while (1)
//     {
//         request_number++;
//         /* code */
//         printf ("zmq_send正在发送1 Hello %d...\n", request_number);
//         ret = zmq_send (requester, "Hello", 5, 0);
//         if(ret < 0) 
//         {
//             printf("zmq_send failed\n");
//         }
//         printf ("zmq_recv\n");
//         ret = zmq_recv (requester, buffer, 6, 0); 
//         if(ret < 0) 
//         {
//             printf("zmq_recv failed\n");
//             zmq_sleep(1);
//         }
//         if(request_number % 20000 == 0) 
//          {
//             end_time = get_tick_count();
//             printf("req-rep need time:%lums, request_number:%lu, ops:%ld/s\n",  
//                 end_time - start_time, request_number, request_number*1000/(end_time - start_time));
//         }
//         // zmq_sleep(1);
//         // char *p = (char *)malloc(10);
//         // free(p);
//     }

//     zmq_close (requester);
//     zmq_ctx_destroy (context);
//     return 0;
// }