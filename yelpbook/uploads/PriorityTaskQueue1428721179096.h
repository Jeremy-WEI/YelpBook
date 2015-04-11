#define HIGH_LEVEL 9 //priority level is 0 ... 9
#define LOW_LEVEL 0
#define MAX_I HIGH_LEVEL - LOW_LEVEL

class PriorityTaskQueue {
private:
	std::queue<Task> queues[MAX_I + 1]; //10 levels

public:
	PriorityTaskQueue() {
		for(int i = MAX_I; i >= 0; i--) {
			std::queue<Task> q; //default constructor
			queues[i] = q;
		}
	}

	/**get front of the queue 
	*/
	Task& front() {
		for(int i = MAX_I; i >= 0; i--) {
			if(!queues[i].empty()) {
				return queues[i].front();
			}
		}
		return queues[0].front(); //undetermined behavior
	}

	void pop() {
		for(int i = MAX_I; i >= 0; i--) {
			if(!queues[i].empty()) {
				return queues[i].pop();
			}
		}
	}

	void push(const Task& task) {
		int priority = task.priority; //priority is 0 to 9. if argument value is not this, exception will happpen
		queues[priority].push(task);
	}

	bool empty() const {
		for(int i = MAX_I; i >= 0; i--) {
			if(!queues[i].empty()) {
				return false;
			}
		}
		return true;
	}
};