N=int(input())
d=[[0,0] for _ in range(N)]
for i in range(N):
    t=[int(x) for x in input().split()]
    d[i][0]=t[0]*60*60+t[1]*60+t[2]
    d[i][1]=t
d=sorted(d,key=lambda x:x[0])
for i,j in d:print(*j)
