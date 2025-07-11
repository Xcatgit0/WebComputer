from PIL import Image

def convert_pixel_to_binary(r, g, b, mode):
    rr = format(r, '02x')
    gg = format(g, '02x')
    bb = format(b, '02x')
    mm = format(mode, '02x')
    return rr + gg + bb + mm

def generate_binary_from_image(image_path):
    image = Image.open(image_path).convert('RGB')
    width, height = image.size
    pixels = image.load()

    hex_data = ''

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]

            # ตรวจสอบว่าเป็นพิกเซลสุดท้ายของภาพหรือไม่
            if x == width - 1 and y == height - 1:
                mode = 0  # สุดท้ายของภาพ -> หยุด
            elif x == width - 1:
                mode = 2  # สุดท้ายของแถว -> ไปแถวใหม่
            else:
                mode = 1  # วาดต่อในแกน X

            hex_data += convert_pixel_to_binary(r, g, b, mode)

    with open("Disk/disk1.dat", "wb") as f:
        f.write(bytes.fromhex(hex_data))

    print("สร้างไฟล์ output.bin สำเร็จ!")

# เรียกใช้งาน
generate_binary_from_image("input.png")
