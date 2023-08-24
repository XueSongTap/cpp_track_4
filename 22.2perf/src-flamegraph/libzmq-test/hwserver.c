//
//  Hello World 服务端
//  绑定一个REP套接字至tcp://*:5555
//  从客户端接收Hello，并应答World
//
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <assert.h>
#include <zmq.h>

void func_c()
{
    for (int i = 35 * 10000; i--;);
}

//gcc -o hwserver hwserver.c -lzmq
int main (int argc, char *argv[])
{
    //  Socket to talk to clients
    void *context = zmq_ctx_new ();
    //  与客户端通信的套接字
    void *responder = zmq_socket (context, ZMQ_REP);
    int rc = zmq_bind (responder, "tcp://*:5555");  // 服务器要做绑定
    assert (rc == 0);

    int32_t sleep = 0; //  0: 服务直接返回world; 1:休眠usleep(1 * 1000) = 1ms; 2:调用func_c处理耗时的任务
    if(argc > 1) {
        sleep = atoi(argv[1]);      // 单位ms
    }

    while (1) {
        //  等待客户端请求
        char buffer [128];
        int size = zmq_recv (responder, buffer, 10, 0); // 接收请求
        buffer[size] = '\0';
        // printf ("收到 %s\n", buffer);
        if(sleep == 1)
            usleep(sleep * 1000);
        else if(sleep == 2)
            func_c();
        //  返回应答
        zmq_send (responder, "World", 5, 0);    // 回发请求
    }
    return 0;
}

// //
// //  Hello World 服务端
// //  绑定一个REP套接字至tcp://*:5555
// //  从客户端接收Hello，并应答World
// //
// #include <stdio.h>
// #include <stdlib.h>
// #include <unistd.h>
// #include <string.h>
// #include <assert.h>
// #include <zmq.h>
// //gcc -o hwserver hwserver.c -lzmq
// int main (int argc, char *argv[])
// {
//     //  Socket to talk to clients
//     void *context = zmq_ctx_new ();
//     //  与客户端通信的套接字
//     void *responder = zmq_socket (context, ZMQ_REP);
//     int send_timeout = 1000;        // 设置超时1000ms
//     int rc = zmq_setsockopt (responder, ZMQ_SNDTIMEO, &send_timeout, sizeof(send_timeout));
//     if(rc < 0)
//     {
//         printf("zmq_setsockopt send_timeout failed\n");
//         return -1;
//     }
//     int recv_timeout = 1000;        // 设置超时1000ms
//     rc = zmq_setsockopt (responder, ZMQ_RCVTIMEO, &recv_timeout, sizeof(recv_timeout));
//     if(rc < 0)
//     {
//         printf("zmq_setsockopt recv_timeout failed\n");
//         return -1;
//     }
//     rc = zmq_bind (responder, "tcp://*:5555");  // 服务器要做绑定
//     assert (rc == 0);

//     int32_t sleep = 0;
//     if(argc > 1) {
//         sleep = atoi(argv[1]);      // 单位ms
//     }

//     while (1) {
//         //  等待客户端请求
//         char buffer [128];
//         printf("zmq_recv into\n");
//         int size = zmq_recv (responder, buffer, 10, 0); // 接收请求
//         if(size < 0) 
//         {
//             printf("zmq_recv timeout");
//              usleep(sleep * 1000);
//         } else {
//             buffer[size] = '\0';
//         printf ("收到 %s\n", buffer);
//         if(sleep > 0)
//             usleep(sleep * 1000);
//         }
        
//         //  返回应答
//         printf("zmq_send into\n");
//         rc = zmq_send (responder, "World", 5, 0);    // 回发请求
//         if(rc < 0) 
//         {
//             printf("zmq_send timeout\n");
//         }
//     }
//     return 0;
// }