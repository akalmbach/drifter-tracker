#!/usr/bin/env python
import roslib; roslib.load_manifest('gps_over_udp')
import rospy
from std_msgs.msg import String
from sensor_msgs.msg import NavSatFix
from sensor_msgs.msg import NavSatStatus

import socket

UDP_IP = "192.168.4.44"
UDP_PORT = 5005

sock = socket.socket(socket.AF_INET, # Internet
                     socket.SOCK_DGRAM) # UDP
sock.bind((UDP_IP, UDP_PORT))


def receiveGpsOverUdp():
    pub = rospy.Publisher('/bozobox/gps/fix', NavSatFix)
    rospy.init_node('gps_over_udp_receiver')
    while not rospy.is_shutdown():
        data, addr = sock.recvfrom(1024) # buffer size is 1024 bytes
        #print "received message: >"+data+'<'
        dataArray = data.split(',');
        fix = NavSatFix()

        fix.header.stamp.secs = int(dataArray[0])
        fix.header.stamp.nsecs = int(dataArray[1])       

	fix.latitude = float(dataArray[2])
        fix.longitude = float(dataArray[3])
        fix.status.status = int(dataArray[4])
        
        print fix.latitude
        print fix.longitude
        print fix.status.status
        
        pub.publish(fix)
        #rospy.sleep(1.0)


if __name__ == '__main__':
    try:
        receiveGpsOverUdp()
    except rospy.ROSInterruptException:
        pass
