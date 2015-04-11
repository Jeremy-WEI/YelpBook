#include <iostream>
#include <queue>
#include <string>
#include "Task.h"


bool same(const Task& task1, const Task& task2) {
  return &task1 == &task2;
}

int main() {
	std::queue<Task> ready; //ready queue

	Task *t0 = new Task;
  t0->name = "bert";
  t0->arrival = 2;
  t0->time = 11;
  t0->remaining = 11;

  ready.push(*t0);
  Task& now = ready.front();
  // now.remaining = 0;
  // std::cout << ready.front().remaining << std::endl;
  
  // if(ready.empty()) {
  //   return 1;
  // }
  Task next = ready.front();
  // Task& ref = ready.front();
  // ready.pop();
  // ready.push(next);
  // now = ready.front();
  // now.remaining = 1;
  // std::cout << ready.front().remaining << " size: " << ready.size() << std::endl;
  std::cout << "ref equal? " << same (now, ready.front()) << std::endl;
  std::cout << "copy equal? " << same (next, ready.front()) << std::endl;
  return 1;
}