cmake_minimum_required(VERSION 2.6)

project (zmq)
add_definitions("-Wall -lpthread -g")  
include_directories(include)

# REQ/REP
ADD_EXECUTABLE(hwserver hwserver.c)
ADD_EXECUTABLE(hwclient hwclient.c )
TARGET_LINK_LIBRARIES(hwserver zmq)
TARGET_LINK_LIBRARIES(hwclient zmq)

# PUB/SUB
ADD_EXECUTABLE(wuserver wuserver.c)
ADD_EXECUTABLE(wuclient wuclient.c)
ADD_EXECUTABLE(wuclient2 wuclient2.c)
TARGET_LINK_LIBRARIES(wuserver zmq)
TARGET_LINK_LIBRARIES(wuclient zmq)
TARGET_LINK_LIBRARIES(wuclient2 zmq)

# PUSH/PULL
ADD_EXECUTABLE(taskvent taskvent.c) 
ADD_EXECUTABLE(taskwork taskwork.c)
ADD_EXECUTABLE(tasksink tasksink.c)  
TARGET_LINK_LIBRARIES(taskvent zmq)
TARGET_LINK_LIBRARIES(taskwork zmq)
TARGET_LINK_LIBRARIES(tasksink zmq)

# ROUTER/DEALER
ADD_EXECUTABLE(rrworker rrworker.c) 
ADD_EXECUTABLE(rrworker2 rrworker2.c) 
ADD_EXECUTABLE(rrbroker rrbroker.c)
ADD_EXECUTABLE(rrclient rrclient.c)  
TARGET_LINK_LIBRARIES(rrworker zmq)
TARGET_LINK_LIBRARIES(rrworker2 zmq)
TARGET_LINK_LIBRARIES(rrbroker zmq)
TARGET_LINK_LIBRARIES(rrclient zmq)







