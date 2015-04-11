#include "Task.h"
#include <vector>
#include <queue>
#include <algorithm>
#include "PriorityTaskQueue.h"

bool compare(const Task& task1, const Task& task2) {
	return task1.arrival < task2.arrival;
}

bool same(const Task& task1, const Task& task2) { //same address rather than just same value
	return &task1 == &task2;
}

void priority_roundrobin(std::vector<Task> tasks, int quantum) {

	std::sort(tasks.begin(), tasks.end(), compare);

	PriorityTaskQueue ready; //ready queue
	int add = 0; //points to the task to be added to task queue next (but not added yet)
	unsigned int exec_time = quantum; //time left in current quantum
	double finish_sum = 0; /*sum of the finish time of all tasks
	waiting_time = finish_time - arrival_time - running_time
	so sum(waiting_time) = sum(finish_time) - sum(arrival_time) - sum(running_time)
	only sum(finish_time) need to be recorded in runtime
	*/

	std::cout << "=======Running PriorityRR scheduler========" << std::endl;

	//loop on time
	int time = 0;
	for(time = 0; ; time++) {
		bool preempt = (!ready.empty() && ready.front().remaining > 0 && exec_time > 0); 
		/*if we have a current task, it is not done yet, and it still have time slice left, 
		then it has the potential to be preempted*/
		Task& old_front = ready.empty()? tasks[add] : ready.front(); //ref to front before new tasks come

		//add new tasks
		while(add < tasks.size() && tasks[add].arrival == time) {
			std::cout << time << ": Adding task " << tasks[add].name << std::endl;
			ready.push(tasks[add]);
			add++;
		}

		if(ready.empty() && add >= tasks.size()) { //all tasks done
			break;
		}
		if(ready.empty()) { //no task now
			continue; 
		}

		/*if old front may be preempted and front changed 
		(which means high priority task just came in), then pre-empt the old one*/
		if(!same(old_front, ready.front()) && preempt) {
			std::cout << time << ": Pre-empting task " << old_front.name << std::endl;
		}

		//deal with the case when exec will be done now
		while(!ready.empty() && ready.front().remaining <= 0) { //use while instead of if, so that an incoming task with remaining <= 0 can be dealt with
			std::cout << time << ": Finished task " << ready.front().name << std::endl;
			finish_sum += time; //finish time recorded
			ready.pop();
			exec_time = quantum;
			if(!ready.empty()) {
				std::cout << time << ": Running task " << ready.front().name << std::endl;
			}
		} 
		if(ready.empty()) {
			continue; //no task right now
		}

		//when time quantum exhausted 
		if(exec_time <= 0) {
			std::cout << time << ": Time slice done for task " << ready.front().name << std::endl;
			Task front = ready.front();
			ready.pop();
			ready.push(front); //push old front to end of queue
			exec_time = quantum;
			std::cout << time << ": Running task " << ready.front().name << std::endl;
		}

		ready.front().remaining--;
		exec_time--;
		
	}
	std::cout << time - 1 << ": All tasks finished" << std::endl;

	//calculate average wating time
	double arrival_sum = 0;
	double running_sum = 0;
	for(std::vector<Task>::iterator it=tasks.begin(); it != tasks.end(); it++) {
		arrival_sum += (it->arrival);
		running_sum += (it->time);
	}
	double waiting = (finish_sum - arrival_sum - running_sum) / tasks.size();

	std::cout << "Average waiting time: " << waiting << std::endl;

}

