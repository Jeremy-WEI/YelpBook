#include <iostream>

/*
  This represents a task (process) to be scheduled.
*/
class Task {
public:
  std::string name;
  unsigned int arrival; // time at which this task arrives
  unsigned int time;    // time it takes to complete this task
  unsigned int remaining; // amount of time left to complete this task
  unsigned int priority; //for priorityRR
};