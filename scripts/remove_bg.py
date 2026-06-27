import os
from PIL import Image

monsters_dir = 'src/assets/monsters'
files = [f for f in os.listdir(monsters_dir) if f.endswith('.png')]

for file in files:
    path = os.path.join(monsters_dir, file)
    img = Image.open(path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # Tolerance for white background (e.g. R>230, G>230, B>230)
    for item in datas:
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            newData.append((255, 255, 255, 0)) # transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(path, "PNG")
    print(f"Processed {file}")
