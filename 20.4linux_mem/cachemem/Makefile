obj-m:=kmemcachec.o	

CURRENT_PAHT:=$(shell pwd) 
LINUX_KERNEL:=$(shell uname -r)   

LINUX_KERNEL_PATH:=/usr/src/linux-headers-$(LINUX_KERNEL)
all:

	make -C $(LINUX_KERNEL_PATH) M=$(CURRENT_PAHT) modules

clean:

	make -C $(LINUX_KERNEL_PATH) M=$(CURRENT_PAHT) cleals
