import { Cpu, MemoryStick, Zap, RadioTower, CircuitBoard, Droplets, HardDrive } from 'lucide-react';
import type { Component, ComponentRequest } from './types';

export const initialComponents: Component[] = [
  { id: '1', name: 'Arduino Uno', description: 'Microcontroller board based on the ATmega328P.', quantity: 25, icon: Cpu },
  { id: '2', name: 'ESP32-WROOM-32', description: 'Powerful Wi-Fi & Bluetooth module.', quantity: 15, icon: RadioTower },
  { id: '3', name: '16x2 LCD Display', description: 'Standard character LCD with backlight.', quantity: 30, icon: MemoryStick },
  { id: '4', name: 'HC-SR04 Ultrasonic Sensor', description: 'Distance measuring sensor using sonar.', quantity: 40, icon: Zap },
  { id: '5', name: 'SG90 Micro Servo', description: 'Tiny servo motor for small projects.', quantity: 50, icon: HardDrive },
  { id: '6', name: 'Raspberry Pi 4', description: 'Single-board computer for various projects.', quantity: 10, icon: CircuitBoard },
  { id: '7', name: 'DHT11 Sensor', description: 'Temperature and humidity sensor.', quantity: 35, icon: Droplets },
];

export const initialRequests: ComponentRequest[] = [
  {
    id: 'req-1',
    userName: 'Alice Johnson',
    department: 'Electrical Engineering',
    year: '3rd',
    purpose: 'Senior design project involving an automated plant watering system.',
    items: [
      { componentId: '1', name: 'Arduino Uno', quantity: 2 },
      { componentId: '7', name: 'DHT11 Sensor', quantity: 3 },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 'req-2',
    userName: 'Bob Williams',
    department: 'Computer Science',
    year: '2nd',
    purpose: 'Personal project to build a small robot arm.',
    items: [
      { componentId: '6', name: 'Raspberry Pi 4', quantity: 1 },
      { componentId: '5', name: 'SG90 Micro Servo', quantity: 4 },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
    {
    id: 'req-3',
    userName: 'Charlie Brown',
    department: 'Mechatronics',
    year: '4th',
    purpose: 'For the annual robotics competition. Need to build a line-following robot.',
    items: [
      { componentId: '1', name: 'Arduino Uno', quantity: 1 },
      { componentId: '4', name: 'HC-SR04 Ultrasonic Sensor', quantity: 2 },
    ],
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  },
];
